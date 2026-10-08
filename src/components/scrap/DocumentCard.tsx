import { Link } from "@tanstack/react-router";
import { Check, Folder, FolderMinus, LogOut, MoreHorizontal, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrCreateCollabLink, leaveCollab } from "@/lib/documents";
import { useAuth } from "@/lib/use-auth";
import { useCollabMap } from "@/lib/use-collab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScrapDocument, ScrapFolder } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DocumentCard({
  doc,
  onDelete,
  preview,
  folders,
  onMove,
}: {
  doc: ScrapDocument;
  onDelete: (id: string) => void;
  preview: boolean;
  folders?: ScrapFolder[] | undefined;
  onMove?: ((docId: string, folderId: string | null) => void) | undefined;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const people = useCollabMap().get(doc.id) ?? [];
  const isOwner = !user || doc.user_id === user.id;
  const others = people.filter((p) => p.user_id !== user?.id);
  const colors = others.map((p) => p.color);
  const badgeStyle =
    colors.length >= 2
      ? { backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})`, WebkitBackgroundClip: "text", color: "transparent" }
      : { color: colors[0] };
  const collaborate = async () => {
    try {
      const url = await getOrCreateCollabLink(doc.id);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Collaboration link copied", { description: "Anyone with it can edit this page." });
    } catch {
      toast.error("Couldn't create a link.");
    }
  };
  const leave = async () => {
    try {
      await leaveCollab(doc.id);
      void qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Left the page");
    } catch {
      toast.error("Couldn't leave that page.");
    }
  };
  return (
    <div className="group relative">
      <Link
        to={doc.kind === "note" ? "/note/$id" : "/page/$id"}
        params={{ id: doc.id }}
        className={cn(
          "block h-full border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
          preview ? "rounded-2xl p-5 shadow-lift" : "flex items-center gap-3 rounded-full py-2.5 pr-12 pl-5",
        )}
      >
        <h3 className={cn("truncate text-[15px] font-semibold tracking-tight", preview && "pr-7")}>
          {doc.title || "Untitled"}
        </h3>
        {preview && (
          <p className="mt-1.5 line-clamp-3 min-h-[3.4em] text-[13px] leading-relaxed text-muted-foreground">
            {doc.plain_text?.trim() || "Empty"}
          </p>
        )}
        <p
          className={cn(
            "text-[11px] tracking-wide text-muted-foreground uppercase",
            preview ? "mt-3" : "ml-auto shrink-0",
          )}
        >
          {relativeDate(doc.updated_at)}
          {others.length > 0 && (
            <span
              title={`Shared with ${others.map((p) => p.username || "someone").join(", ")}`}
              className="ml-2.5 inline-block text-[12px] font-bold normal-case"
              style={badgeStyle}
            >
              C
            </span>
          )}
        </p>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Options"
            className={cn(
              "absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent focus:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
              preview ? "top-3.5" : "top-1/2 -translate-y-1/2",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {doc.kind === "page" && isOwner && (
            <DropdownMenuItem onSelect={() => void collaborate()}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              Collaborate
            </DropdownMenuItem>
          )}
          {doc.kind === "page" && isOwner && folders && onMove && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                  Add to folder
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {folders.length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Create a folder first.</p>
                  )}
                  {folders.map((f) => (
                    <DropdownMenuItem key={f.id} onSelect={() => onMove(doc.id, f.id)}>
                      <Folder className="mr-2 h-4 w-4" style={{ color: `var(--folder-${f.color})` }} />
                      <span className="truncate">{f.name}</span>
                      {doc.folder_id === f.id && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {doc.folder_id && (
                <DropdownMenuItem onSelect={() => onMove(doc.id, null)}>
                  <FolderMinus className="mr-2 h-4 w-4 text-muted-foreground" />
                  Remove from folder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          {isOwner ? (
            <DropdownMenuItem onSelect={() => onDelete(doc.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Move to Trash
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => void leave()}>
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              Leave page
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
