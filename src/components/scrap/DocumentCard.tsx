import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScrapDocument } from "@/lib/scrap-types";

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
}: {
  doc: ScrapDocument;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group relative">
      <Link
        to={doc.kind === "note" ? "/note/$id" : "/page/$id"}
        params={{ id: doc.id }}
        className="block h-full rounded-2xl border border-border bg-card p-5 shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40"
      >
        <h3 className="line-clamp-1 pr-7 text-[15px] font-semibold tracking-tight">
          {doc.title || "Untitled"}
        </h3>
        <p className="mt-1.5 line-clamp-3 min-h-[3.4em] text-[13px] leading-relaxed text-muted-foreground">
          {doc.plain_text?.trim() || "Empty"}
        </p>
        <p className="mt-3 text-[11px] tracking-wide text-muted-foreground/70 uppercase">
          {relativeDate(doc.updated_at)}
        </p>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Document options"
            className="absolute top-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent focus:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => onDelete(doc.id)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
