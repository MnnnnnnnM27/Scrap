import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search, Sparkle, StickyNote, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/scrap/AuthGate";
import { DocumentCard } from "@/components/scrap/DocumentCard";
import { ScrapLogo } from "@/components/scrap/ScrapLogo";
import { SettingsBubble } from "@/components/scrap/SettingsBubble";
import { createDocument, listDocuments, trashDocument } from "@/lib/documents";
import type { DocKind, ScrapDocument } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

type View = "all" | "notes" | "pages";

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { view?: View } => {
    const v = search['view'];
    return v === "notes" || v === "pages" ? { view: v } : {};
  },
  head: () => ({
    meta: [
      { title: "Scrap — your notes and pages" },
      {
        name: "description",
        content: "All your quick notes and long-form pages in one calm, minimal place.",
      },
      { property: "og:title", content: "Scrap — your notes and pages" },
      {
        property: "og:description",
        content: "All your quick notes and long-form pages in one calm, minimal place.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <Home />
    </AuthGate>
  ),
});

function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { view = "all" } = Route.useSearch();
  const [search, setSearch] = useState("");

  const setView = (next: View) =>
    void navigate({ to: "/", search: next === "all" ? {} : { view: next }, replace: true });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(false),
  });

  const create = useMutation({
    mutationFn: (kind: DocKind) => createDocument(kind),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      void navigate({
        to: doc.kind === "note" ? "/note/$id" : "/page/$id",
        params: { id: doc.id },
      });
    },
    onError: () => toast.error("Couldn't create that just now."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => trashDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Moved to Trash");
    },
    onError: () => toast.error("Couldn't delete that just now."),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (d: ScrapDocument) =>
      !q ||
      (d.title || "untitled").toLowerCase().includes(q) ||
      d.plain_text.toLowerCase().includes(q);
    return {
      notes: documents.filter((d) => d.kind === "note" && match(d)),
      pages: documents.filter((d) => d.kind === "page" && match(d)),
    };
  }, [documents, search]);

  return (
    <div className="min-h-screen pb-28">
      <SettingsBubble />

      <Link
        to="/research"
        aria-label="Research mode"
        className="glass fixed bottom-6 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-brand transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <Sparkle className="h-5 w-5" />
      </Link>

      <div className="mx-auto max-w-5xl px-6 pt-24 sm:px-10">
        <header className="mb-8">
          <ScrapLogo wordClassName="text-[40px]" markClassName="h-9 w-9" />
          <p className="mt-2 text-[15px] text-muted-foreground">
            Quick notes and long-form pages, all in one place.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <ViewSwitcher view={view} onChange={setView} />
          {view !== "all" && (
            <button
              type="button"
              onClick={() => create.mutate(view === "notes" ? "note" : "page")}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          )}
          <Link
            to="/trash"
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Trash
          </Link>
        </div>

        <div className="relative mb-12">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes and pages"
            className="w-full rounded-full border border-border bg-card py-3 pr-4 pl-11 text-[15px] outline-none focus:border-brand"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-14">
            {view !== "pages" && (
              <Section
                id="notes"
                title="Notes"
                icon={<StickyNote className="h-4 w-4" />}
                docs={filtered.notes}
                emptyLabel="No notes yet."
                onDelete={(id) => remove.mutate(id)}
              />
            )}
            {view !== "notes" && (
              <Section
                id="pages"
                title="Pages"
                icon={<FileText className="h-4 w-4" />}
                docs={filtered.pages}
                emptyLabel="No pages yet."
                onDelete={(id) => remove.mutate(id)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewSwitcher({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const options: { key: Exclude<View, "all">; label: string }[] = [
    { key: "notes", label: "Notes" },
    { key: "pages", label: "Pages" },
  ];
  return (
    <div className="glass relative flex items-center rounded-full p-1 text-[13px]">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-brand transition-all duration-300 ease-out",
          view === "all" && "scale-90 opacity-0",
          view === "pages" && "translate-x-[calc(100%+4px)]",
        )}
      />
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={view === o.key}
          onClick={() => onChange(view === o.key ? "all" : o.key)}
          className={cn(
            "relative z-10 min-w-[84px] rounded-full px-4 py-1.5 font-medium transition-colors",
            view === o.key ? "text-brand-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  id,
  title,
  icon,
  docs,
  emptyLabel,
  onDelete,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  docs: ScrapDocument[];
  emptyLabel: string;
  onDelete: (id: string) => void;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-2 text-brand">
        {icon}
        <h2 className="text-[13px] font-semibold tracking-[0.12em] uppercase">{title}</h2>
        <span className="text-[13px] text-muted-foreground">{docs.length}</span>
      </div>
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
