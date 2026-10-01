import { ChevronRight, Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { DocumentCard } from "@/components/scrap/DocumentCard";
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

export function FolderList({
  folders,
  docs,
  preview,
  onDelete,
  onMove,
  onSave,
  onDeleteFolder,
}: {
  folders: ScrapFolder[];
  docs: ScrapDocument[];
  preview: boolean;
  onDelete: (id: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
  onSave: (d: Draft) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const grid = preview ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-2 sm:grid-cols-2";

  return (
    <div className="space-y-2">
      {folders.map((f) => {
        const items = docs.filter((d) => d.folder_id === f.id);
        const isOpen = open[f.id] ?? true;
        return (
          <div key={f.id} className="group/folder">
            <div className="flex items-center gap-1 rounded-xl pr-1 transition-colors hover:bg-accent/60">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [f.id]: !isOpen }))}
                className="flex min-h-11 flex-1 items-center gap-2.5 px-2 text-left"
              >
                <ChevronRight
                  className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out", isOpen && "rotate-90")}
                />
                <Folder className="h-[18px] w-[18px]" style={{ color: `var(--folder-${f.color})`, fill: `color-mix(in oklab, var(--folder-${f.color}) 22%, transparent)` }} />
                <span className="truncate text-[15px] font-medium">{f.name}</span>
                <span className="text-[13px] text-muted-foreground">{items.length}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${f.name} options`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover/folder:opacity-100 hover:bg-accent focus:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => setDraft({ id: f.id, name: f.name, color: f.color })}>
                    <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Edit folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onDeleteFolder(f.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="py-2 pl-8">
                  {items.length === 0 ? (
                    <p className="py-2 text-[13px] text-muted-foreground">Empty — use ••• on a page to add it here.</p>
                  ) : (
                    <div className={grid}>
                      {items.map((d) => (
                        <DocumentCard key={d.id} doc={d} preview={preview} folders={folders} onMove={onMove} onDelete={onDelete} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setDraft({ name: "", color: "marine" })}
        className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-[14px] text-brand transition-colors hover:bg-accent/60"
      >
        <FolderPlus className="h-[18px] w-[18px]" /> New folder
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
    </div>
  );
}
