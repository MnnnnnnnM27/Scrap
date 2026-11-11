import { FileText, Folder, FolderPlus, Inbox, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FOLDER_COLORS, type FolderColor, type FolderView, type ScrapDocument, type ScrapFolder } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Draft = { id?: string; name: string; color: FolderColor };
export type FolderSelection = "all" | "unfiled" | string;

/** Sidebar of folders; the main area shows only the selected folder's pages. */
export function FolderList({
  folders,
  docs,
  selected,
  onSelect,
  onSave,
  onDeleteFolder,
  view = "compact",
}: {
  folders: ScrapFolder[];
  docs: ScrapDocument[];
  selected: FolderSelection;
  onSelect: (s: FolderSelection) => void;
  onSave: (d: Draft) => void;
  onDeleteFolder: (id: string) => void;
  view?: FolderView;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const known = new Set(folders.map((f) => f.id));
  const unfiled = docs.filter((d) => !d.folder_id || !known.has(d.folder_id)).length;

  const row = (active: boolean) =>
    cn(
      "flex h-11 min-w-0 shrink-0 items-center justify-start gap-2.5 rounded-lg px-3 text-left text-sm transition-colors",
      view === "sidebar" ? "w-full" : "w-auto",
      active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
    );

  return (
    <nav aria-label="Folders" className={cn("flex", view === "sidebar" ? "flex-col gap-1" : "flex-wrap gap-2 border-b border-border/60 pb-6")}>
      <Button variant="ghost" aria-pressed={selected === "all"} className={row(selected === "all")} onClick={() => onSelect("all")}>
        <FileText className="h-4 w-4" /> <span className="flex-1 whitespace-nowrap">All pages</span>
        <span className="text-[12px] text-muted-foreground">{docs.length}</span>
      </Button>
      <Button variant="ghost" aria-pressed={selected === "unfiled"} className={row(selected === "unfiled")} onClick={() => onSelect("unfiled")}>
        <Inbox className="h-4 w-4" /> <span className="flex-1 whitespace-nowrap">Unfiled</span>
        <span className="text-[12px] text-muted-foreground">{unfiled}</span>
      </Button>

      <div className={cn("px-3 pt-4 pb-1 text-[11px] font-semibold text-muted-foreground uppercase", view === "compact" && "hidden")}>
        Folders
      </div>

      {folders.map((f) => {
        const count = docs.filter((d) => d.folder_id === f.id).length;
        return (
          <div key={f.id} className={cn("group/folder relative flex shrink-0 items-center", row(selected === f.id), "p-0")}>
            <Button variant="ghost" aria-pressed={selected === f.id} onClick={() => onSelect(f.id)} className="h-11 min-w-0 flex-1 justify-start gap-2.5 pr-0 pl-3 text-left hover:bg-transparent">
              <Folder
                className="h-4 w-4 shrink-0"
                style={{ color: `var(--folder-${f.color})`, fill: `color-mix(in oklab, var(--folder-${f.color}) 22%, transparent)` }}
              />
              <span className="max-w-[10rem] truncate">{f.name}</span>
            </Button>
            <span className="px-2 text-[12px] text-muted-foreground">{count}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${f.name} options`}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-0 hover:bg-background/60 group-hover/folder:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setDraft({ id: f.id, name: f.name, color: f.color })}>
                  <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Edit folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { if (selected === f.id) onSelect("all"); onDeleteFolder(f.id); }}>
                  <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" /> Delete folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      <Button
        variant="ghost"
        onClick={() => setDraft({ name: "", color: "marine" })}
        className="h-11 shrink-0 justify-start gap-2.5 rounded-lg px-3 text-sm text-brand hover:bg-accent/60 hover:text-brand"
      >
        <FolderPlus className="h-4 w-4" /> New folder
      </Button>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit folder" : "New folder"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <form
              id="folder-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.name.trim()) return;
                onSave({ ...draft, name: draft.name.trim() });
                setDraft(null);
              }}
              className="space-y-5"
            >
              <label className="block">
                <span className="mb-1.5 block text-[13px] text-muted-foreground">Name</span>
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Essays"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-brand"
                />
              </label>
              <div>
                <span className="mb-2 block text-[13px] text-muted-foreground">Color</span>
                <div className="flex gap-3">
                  {FOLDER_COLORS.map((c) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      key={c}
                      type="button"
                      aria-label={c}
                      aria-pressed={draft.color === c}
                      onClick={() => setDraft({ ...draft, color: c })}
                      className={cn(
                        "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                        draft.color === c && "ring-2 ring-foreground/40",
                      )}
                      style={{ background: `var(--folder-${c})` }}
                    />
                  ))}
                </div>
              </div>
            </form>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)} className="rounded-full text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" form="folder-form" disabled={!draft?.name.trim()} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              {draft?.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
