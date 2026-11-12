import type { Editor } from "@tiptap/react";
import { BookOpen, Bold, ChevronLeft, ChevronRight, ImagePlus, Italic, List, Pencil, Plus, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BookMetadata } from "@/lib/scrap-types";
import { paginateBook } from "@/lib/books";

export function BookTools({ editor, book, onChange, reading, onReading, words }: { editor: Editor; book: BookMetadata; onChange: (book: BookMetadata) => void; reading: boolean; onReading: (value: boolean) => void; words: number }) {
  const [open, setOpen] = useState(false);
  const [chapters, setChapters] = useState<{ title: string; pos: number }[]>([]);
  useEffect(() => { const update = () => { const items: typeof chapters = []; editor.state.doc.descendants((node, pos) => { if (node.type.name === "heading" && node.attrs.level === 1) items.push({ title: node.textContent || "Untitled chapter", pos }); }); setChapters(items); }; update(); editor.on("update", update); return () => { editor.off("update", update); }; }, [editor]);
  const cover = async (file: File | undefined, side: "front_cover" | "back_cover") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image.");
    if (file.size > 2 * 1024 * 1024) return void toast.error("Choose a cover under 2 MB.");
    const value = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    onChange({ ...book, [side]: value });
  };
  return <>
    <div className="no-print mx-auto mb-5 flex max-w-3xl flex-wrap items-center gap-1 border-b border-border pb-3">
      <div className="flex rounded-full bg-muted p-1" role="group" aria-label="Book mode">
        <Button size="sm" variant={reading ? "ghost" : "default"} className="rounded-full" aria-pressed={!reading} onClick={() => onReading(false)}><Pencil />Edit</Button>
        <Button size="sm" variant={reading ? "default" : "ghost"} className="rounded-full" aria-pressed={reading} onClick={() => onReading(true)}><BookOpen />Read</Button>
      </div>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Chapters" title="Chapters"><List /></Button></DropdownMenuTrigger><DropdownMenuContent>
        {chapters.map(c => <DropdownMenuItem key={c.pos} onSelect={() => { onReading(false); editor.chain().focus().setTextSelection(c.pos + 1).scrollIntoView().run(); }}>{c.title}</DropdownMenuItem>)}
        {!reading && <DropdownMenuItem onSelect={() => editor.chain().focus().insertContentAt(editor.state.doc.content.size, [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: `Chapter ${chapters.length + 1}` }] }, { type: "paragraph" }]).run()}><Plus />New chapter</DropdownMenuItem>}
      </DropdownMenuContent></DropdownMenu>
      {!reading && <><Button variant="ghost" size="icon" aria-label="Bold" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></Button><Button variant="ghost" size="icon" aria-label="Italic" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></Button></>}
      <Button variant="ghost" size="icon" aria-label="Book details" title="Book details" onClick={() => setOpen(true)}><Settings2 /></Button>
      <span className="ml-auto text-xs tabular-nums text-muted-foreground">{words.toLocaleString()} / {book.word_target.toLocaleString()}</span>
      <progress aria-label="Writing target" className="book-progress h-1 w-16" value={words} max={book.word_target} />
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto"><DialogTitle>Book details</DialogTitle>
      {([ ["author", "Author"], ["subtitle", "Subtitle"] ] as const).map(([key, label]) => <label key={key} className="space-y-1 text-sm">{label}<input aria-label={label} className="w-full rounded-md border border-input bg-background p-2" value={book[key]} onChange={e => onChange({ ...book, [key]: e.target.value })} /></label>)}
      <label className="space-y-1 text-sm">Back-cover text<textarea aria-label="Back-cover text" rows={3} className="w-full rounded-md border border-input bg-background p-2" value={book.blurb} onChange={e => onChange({ ...book, blurb: e.target.value })} /></label>
      <label className="space-y-1 text-sm">Word target<input aria-label="Word target" type="number" min={1} max={1000000} className="w-full rounded-md border border-input bg-background p-2" value={book.word_target} onChange={e => { const n = Number(e.target.value); if (n > 0) onChange({ ...book, word_target: Math.min(1000000, Math.round(n)) }); }} /></label>
      <div className="grid grid-cols-2 gap-4">{(["front_cover", "back_cover"] as const).map(side => <div key={side} className="space-y-2">
        <p className="text-sm">{side === "front_cover" ? "Front cover" : "Back cover"}</p>
        {book[side] && <img src={book[side]} alt={side === "front_cover" ? "Front cover" : "Back cover"} className="aspect-[2/3] w-full rounded-md object-cover" />}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-brand"><ImagePlus className="h-4 w-4" />Choose image<input aria-label={side === "front_cover" ? "Upload front cover" : "Upload back cover"} type="file" accept="image/*" className="sr-only" onChange={e => { void cover(e.target.files?.[0], side).catch(() => toast.error("Couldn't open that image.")); e.target.value = ""; }} /></label>
        {book[side] && <Button variant="ghost" size="sm" onClick={() => onChange({ ...book, [side]: "" })}>Remove</Button>}
      </div>)}</div>
    </DialogContent></Dialog>
  </>;
}

export function BookReader({ title, book, html }: { title: string; book: BookMetadata; html: string }) {
  const [pages, setPages] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  useEffect(() => { setPages(paginateBook(html)); setPage(0); }, [html]);
  const end = pages.length + 1;
  return <div className="mx-auto max-w-3xl">
    <div key={page} className="book-sheet canvas-surface mx-auto flex aspect-[2/3] max-h-[75vh] min-h-96 w-full max-w-lg flex-col overflow-y-auto rounded-md border border-border p-8 sm:p-12" aria-label="Book sheet">
      {page === 0 ? <>{book.front_cover && <img src={book.front_cover} alt="Front cover" className="mb-6 max-h-64 w-full object-contain" />}<div className="my-auto text-center"><h1 className="break-words text-3xl font-semibold">{title || "Untitled"}</h1>{book.subtitle && <p className="mt-4 text-lg">{book.subtitle}</p>}<p className="mt-8 text-sm text-muted-foreground">{book.author}</p></div></> : page === end ? <>{book.back_cover && <img src={book.back_cover} alt="Back cover" className="mb-6 max-h-64 w-full object-contain" />}<p className="my-auto text-base leading-relaxed whitespace-pre-wrap">{book.blurb}</p></> : <><div className="scrap-editor flex-1"><div className="ProseMirror" dangerouslySetInnerHTML={{ __html: pages[page - 1] ?? "" }} /></div><p className="pt-8 text-center text-xs text-muted-foreground">{page}</p></>}
    </div>
    <div className="no-print mt-5 flex items-center justify-center gap-4"><Button variant="ghost" size="icon" aria-label="Previous book page" title="Previous page" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft /></Button><span className="min-w-24 text-center text-xs tabular-nums text-muted-foreground">{page === 0 ? "Front cover" : page === end ? "Back cover" : `${page} / ${pages.length}`}</span><Button variant="ghost" size="icon" aria-label="Next book page" title="Next page" disabled={page === end} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button></div>
  </div>;
}