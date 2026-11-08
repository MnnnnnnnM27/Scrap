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
import { FOLDER_COLORS, type FolderColor, type ScrapDocument, type ScrapFolder } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

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
}: {
  folders: ScrapFolder[];
  docs: ScrapDocument[];
  selected: FolderSelection;
  onSelect: (s: FolderSelection) => void;
  onSave: (d: Draft) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const known = new Set(folders.map((f) => f.id));
  const unfiled = docs.filter((d) => !d.folder_id || !known.has(d.folder_id)).length;

  const row = (active: boolean) =>
    cn(
      "flex min-h-10 w-full shrink-0 items-center gap-2.5 rounded-xl px-3 text-left text-[14px] transition-colors lg:w-full",
      active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
    );

  return (
    <nav aria-label="Folders" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      <button type="button" className={cn(row(selected === "all"), "w-auto")} onClick={() => onSelect("all")}>
        <FileText className="h-4 w-4" /> <span className="flex-1 whitespace-nowrap">All pages</span>
        <span className="text-[12px] text-muted-foreground">{docs.length}</span>
      </button>
      <button type="button" className={cn(row(selected === "unfiled"), "w-auto")} onClick={() => onSelect("unfiled")}>
        <Inbox className="h-4 w-4" /> <span className="flex-1 whitespace-nowrap">Unfiled</span>
        <span className="text-[12px] text-muted-foreground">{unfiled}</span>
      </button>

      <div className="hidden px-3 pt-4 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase lg:block">
        Folders
      </div>

      {folders.map((f) => {
        const count = docs.filter((d) => d.folder_id === f.id).length;
        return (
          <div key={f.id} className={cn("group/folder relative flex shrink-0 items-center", row(selected === f.id), "w-auto p-0 lg:w-full")}>
            <button type="button" onClick={() => onSelect(f.id)} className="flex min-h-10 flex-1 items-center gap-2.5 pl-3 text-left">
              <Folder
                className="h-4 w-4"
                style={{ color: `var(--folder-${f.color})`, fill: `color-mix(in oklab, var(--folder-${f.color}) 22%, transparent)` }}
              />
              <span className="max-w-[10rem] truncate whitespace-nowrap">{f.name}</span>
            </button>
            <span className="pr-1 text-[12px] text-muted-foreground group-hover/folder:hidden lg:pr-3">{count}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${f.name} options`}
                  className="mr-1 hidden h-7 w-7 items-center justify-center rounded-full hover:bg-background/60 group-hover/folder:flex data-[state=open]:flex [@media(hover:none)]:flex"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
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

      <button
        type="button"
        onClick={() => setDraft({ name: "", color: "marine" })}
        className="flex min-h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-[14px] whitespace-nowrap text-brand transition-colors hover:bg-accent/60"
      >
        <FolderPlus className="h-4 w-4" /> New folder
      </button>

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
                    <button
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
            <button type="button" onClick={() => setDraft(null)} className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
              Cancel
            </button>
            <button type="submit" form="folder-form" disabled={!draft?.name.trim()} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-40">
              {draft?.id ? "Save" : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
