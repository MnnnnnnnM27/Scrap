import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/scrap/AuthGate";
import { destroyDocument, listDocuments, restoreDocument } from "@/lib/documents";

export const Route = createFileRoute("/trash")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Trash — Scrap" },
      { name: "description", content: "Restore or permanently delete notes and pages." },
      { property: "og:title", content: "Trash — Scrap" },
      { property: "og:description", content: "Restore or permanently delete notes and pages." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Trash />
    </AuthGate>
  ),
});

function Trash() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["documents", "trash"], queryFn: () => listDocuments(true) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["documents"] });
  const restore = useMutation({ mutationFn: restoreDocument, onSuccess: () => { refresh(); toast.success("Restored"); } });
  const destroy = useMutation({ mutationFn: destroyDocument, onSuccess: () => { refresh(); toast.success("Deleted forever"); } });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
      <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Trash</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">Items are deleted permanently after 30 days.</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">Trash is empty.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {data.map((d) => {
            const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(d.deleted_at!).getTime()) / 86400000));
            return (
              <li key={d.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{d.kind === "note" ? "Note" : "Page"} · {daysLeft} days left</p>
                </div>
                <button type="button" onClick={() => restore.mutate(d.id)} className="rounded-full border border-brand px-3 py-1.5 text-[13px] text-brand hover:bg-brand-soft">Restore</button>
                <button
                  type="button"
                  onClick={() => confirm("Delete permanently? This can't be undone.") && destroy.mutate(d.id)}
                  className="rounded-full px-3 py-1.5 text-[13px] text-destructive hover:bg-destructive/10"
                >
                  Delete permanently
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
