import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EditorContent, useEditor } from "@tiptap/react";
import { Download, Link2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatThread } from "@/components/scrap/ChatThread";
import { Toolbar } from "@/components/scrap/Toolbar";
import { TopBar } from "@/components/scrap/TopBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { completeText } from "@/lib/ai.functions";
import { getDocument, getOrCreateShareLink, revokeShareLinks, saveDocument } from "@/lib/documents";
import { buildExtensions } from "@/lib/editor-extensions";
import { exportDocx, exportMarkdown, exportMnml, exportPng } from "@/lib/export";
import type { DocKind, ScrapDocument } from "@/lib/scrap-types";
import type { Json } from "@/integrations/supabase/types";

export function DocumentEditorScreen({ id, kind }: { id: string; kind: DocKind }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
    staleTime: Infinity,
  });
  if (isLoading) return <div className="p-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (error || !data || data.deleted_at)
    return <div className="p-24 text-center text-sm text-muted-foreground">This document isn't available.</div>;
  return <Editor key={data.id} doc={data} kind={kind} />;
}

function Editor({ doc, kind }: { doc: ScrapDocument; kind: DocKind }) {
  const [title, setTitle] = useState(doc.title);
  const [askOpen, setAskOpen] = useState(false);
  const [ghost, setGhost] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ title?: string; content?: Json; plain_text?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ghostRef = useRef("");
  ghostRef.current = ghost;
  const complete = useServerFn(completeText);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length) void saveDocument(doc.id, patch).catch(() => toast.error("Couldn't save — check your connection."));
  }, [doc.id]);

  const queue = useCallback(
    (patch: typeof pending.current) => {
      pending.current = { ...pending.current, ...patch };
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush],
  );

  const editor = useEditor({
    extensions: buildExtensions(kind),
    content: doc.content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none" },
      handleKeyDown: (view, event) => {
        if (event.key === "Tab" && ghostRef.current) {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(ghostRef.current));
          setGhost("");
          return true;
        }
        if (event.key === "Escape") setGhost("");
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      queue({ content: e.getJSON() as Json, plain_text: e.getText() });
      setGhost("");
      clearTimeout(aiTimer.current);
      const { from, to } = e.state.selection;
      if (from !== to || from !== e.state.doc.content.size - 1) return; // only at end of doc
      const before = e.getText();
      aiTimer.current = setTimeout(async () => {
        try {
          const res = await complete({ data: { before: before.slice(-4000), kind } });
          if (e.getText() === before && res.suggestion) {
            setGhost((before.endsWith(" ") || res.suggestion.startsWith(" ") ? "" : " ") + res.suggestion);
          }
        } catch {
          /* autocomplete is best-effort */
        }
      }, 1400);
    },
  });

  useEffect(() => () => { clearTimeout(aiTimer.current); flush(); }, [flush]);
  useEffect(() => {
    const h = () => flush();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [flush]);

  const current = (): ScrapDocument => ({
    ...doc,
    title,
    content: (editor?.getJSON() ?? doc.content) as ScrapDocument["content"],
  });

  const share = async () => {
    try {
      const token = await getOrCreateShareLink(doc.id);
      const url = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("View-only link copied", { description: url });
    } catch {
      toast.error("Couldn't create a link.");
    }
  };

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Share and export" className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft">
          <Download className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={share}><Link2 className="mr-2 h-4 w-4" />Copy view-only link</DropdownMenuItem>
        <DropdownMenuItem onClick={() => revokeShareLinks(doc.id).then(() => toast.success("Links turned off"))}>
          <X className="mr-2 h-4 w-4" />Turn off shared links
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportMarkdown(current())}>Markdown (.md)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportMnml(current())}>Minimal Notes (.mnml)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void exportDocx(current())}>Word (.docx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => canvasRef.current && void exportPng(current(), canvasRef.current)}>Image (.png)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen">
      <TopBar kind={kind} onAskGemini={() => setAskOpen(true)} left={menu} />
      {editor && <Toolbar editor={editor} kind={kind} />}
      <main className="px-4 pt-24 pb-32 pr-20 sm:px-10 sm:pr-24">
        <div ref={canvasRef} className="canvas-surface mx-auto min-h-[70vh] max-w-3xl rounded-3xl px-6 py-10 sm:px-12">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              queue({ title: e.target.value });
            }}
            placeholder="Untitled"
            className="mb-6 w-full bg-transparent font-[family-name:var(--font-doc)] text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
          />
          <div className="scrap-editor">
            <EditorContent editor={editor} />
          </div>
          {ghost && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="opacity-60">{ghost}</span>
              <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[11px]">Tab</span>
            </p>
          )}
        </div>
      </main>

      {askOpen && (
        <aside className="glass fixed top-3 right-3 bottom-3 z-50 flex w-[min(420px,calc(100vw-24px))] flex-col rounded-3xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Ask Gemini <span className="font-normal text-muted-foreground">· this {kind}</span></h2>
            <button type="button" aria-label="Close" onClick={() => setAskOpen(false)} className="rounded-full p-1.5 text-brand hover:bg-brand-soft">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ChatThread
            getBody={() => ({ documentTitle: title, documentText: editor?.getText() ?? "" })}
            placeholder={`Ask about this ${kind}…`}
            quickActions={["Summarize this", "Continue writing", "Rewrite more clearly", "Fix grammar"]}
          />
        </aside>
      )}
    </div>
  );
}
