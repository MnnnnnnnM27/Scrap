import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, PanelLeft, Plus, Search, Sparkle, StickyNote, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/scrap/AuthGate";
import { DocumentCard } from "@/components/scrap/DocumentCard";
import { ScrapMark } from "@/components/scrap/ScrapLogo";
import { FolderList, type FolderSelection } from "@/components/scrap/FolderList";
import { useSettings } from "@/lib/settings";
import { SettingsBubble } from "@/components/scrap/SettingsBubble";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createDocument, createFolder, deleteFolder, listDocuments, listFolders, moveToFolder, trashDocument, updateFolder } from "@/lib/documents";
import type { DocKind, ScrapDocument, ScrapFolder } from "@/lib/scrap-types";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { view: rawView = "all" } = Route.useSearch();
  const { settings: appSettings } = useSettings();
  const view: View = appSettings.pages_only ? "pages" : rawView;
  const [search, setSearch] = useState("");
  const [foldersOpen, setFoldersOpen] = useState(false);
  const setView = (next: View) =>
    void navigate({ to: "/", search: next === "all" ? {} : { view: next }, replace: true });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(false),
  });

  const { settings } = useSettings();
  const preview = settings.card_previews;
  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
    void queryClient.invalidateQueries({ queryKey: ["folders"] });
  };
  const move = useMutation({
    mutationFn: ({ docId, folderId }: { docId: string; folderId: string | null }) => moveToFolder(docId, folderId),
    onSuccess: refreshAll,
    onError: () => toast.error("Couldn't move that page."),
  });
  const saveFolder = useMutation({
    mutationFn: (d: { id?: string; name: string; color: ScrapFolder["color"] }) =>
      d.id ? updateFolder(d.id, { name: d.name, color: d.color }) : createFolder(d.name, d.color).then(() => {}),
    onSuccess: refreshAll,
    onError: () => toast.error("Couldn't save the folder."),
  });
  const removeFolder = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => { refreshAll(); toast.success("Folder deleted — its pages are still in Pages"); },
  });
  const onMove = (docId: string, folderId: string | null) => move.mutate({ docId, folderId });

  const create = useMutation({
    mutationFn: async (kind: DocKind) => {
      const doc = await createDocument(kind);
      if (kind === "page" && selFolder) await moveToFolder(doc.id, selFolder.id).catch(() => {});
      return doc;
    },
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

  const [folderSel, setFolderSel] = useState<FolderSelection>("all");
  const activeFolder = folderSel === "all" || folderSel === "unfiled" || folders.some((f) => f.id === folderSel);
  const sel = activeFolder ? folderSel : "all";
  const selFolder = folders.find((f) => f.id === sel);
  const folderTitle = sel === "unfiled" ? "Unfiled" : selFolder ? selFolder.name : "All pages";

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
  const folderDocs =
    sel === "all"
      ? filtered.pages
      : sel === "unfiled"
        ? filtered.pages.filter((d) => !d.folder_id || !folders.some((f) => f.id === d.folder_id))
        : filtered.pages.filter((d) => d.folder_id === sel);

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
          <h1 className="sr-only">Scrap</h1>
          {view !== "all" && !appSettings.pages_only ? (
            <Link to="/" aria-label="Home" title="Home" className="inline-block rounded-xl text-brand transition-transform hover:scale-105 active:scale-95">
              <ScrapMark className="h-11 w-11" />
            </Link>
          ) : (
            <ScrapMark className="h-11 w-11 text-brand" />
          )}
          <p className="mt-2 text-[15px] text-muted-foreground">
            Quick notes and long-form pages, all in one place.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {!appSettings.pages_only && <ViewSwitcher view={view} onChange={setView} />}
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
            type="search"
            aria-label="Search notes and pages"
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
                preview={preview}
                id="notes"
                title="Notes"
                icon={<StickyNote className="h-4 w-4" />}
                docs={filtered.notes}
                emptyLabel="No notes yet."
                onDelete={(id) => remove.mutate(id)}
              />
            )}
            {view === "pages" && (
              <div className={cn("flex flex-col gap-6", settings.folder_view === "sidebar" && "md:flex-row md:gap-8")}>
                {settings.folder_view === "sidebar" && (
                  <div className="md:hidden">
                    <Button variant="ghost" onClick={() => setFoldersOpen(true)} className="rounded-full">
                      <PanelLeft /> Folders
                    </Button>
                    <Sheet open={foldersOpen} onOpenChange={setFoldersOpen}>
                      <SheetContent side="left" className="w-[min(320px,90vw)] overflow-y-auto">
                        <SheetHeader><SheetTitle>Folders</SheetTitle></SheetHeader>
                        <div className="px-4 pb-6">
                          <FolderList
                            view="sidebar"
                            folders={folders}
                            docs={filtered.pages}
                            selected={sel}
                            onSelect={(next) => { setFolderSel(next); setFoldersOpen(false); }}
                            onSave={(d) => saveFolder.mutate(d)}
                            onDeleteFolder={(id) => removeFolder.mutate(id)}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
                <aside className={cn("min-w-0", settings.folder_view === "sidebar" ? "hidden md:sticky md:top-24 md:block md:w-48 md:shrink-0 md:self-start" : "w-full")}>
                  <FolderList
                    view={settings.folder_view}
                    folders={folders}
                    docs={filtered.pages}
                    selected={activeFolder ? folderSel : "all"}
                    onSelect={setFolderSel}
                    onSave={(d) => saveFolder.mutate(d)}
                    onDeleteFolder={(id) => removeFolder.mutate(id)}
                  />
                </aside>
                <div className="min-w-0 flex-1">
                  <Section
                    preview={preview}
                    folders={folders}
                    onMove={onMove}
                    id="pages"
                    title={folderTitle}
                    icon={<FileText className="h-4 w-4" />}
                    docs={folderDocs}
                    emptyLabel={folderSel === "all" || !activeFolder ? "No pages yet." : "Nothing here yet — use ••• on a page to move it in."}
                    onDelete={(id) => remove.mutate(id)}
                  />
                </div>
              </div>
            )}
            {view === "all" && (
              <Section
                preview={preview}
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
          view === "pages" && "translate-x-full",
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
  preview,
  folders,
  onMove,
}: {
  preview: boolean;
  folders?: ScrapFolder[] | undefined;
  onMove?: ((docId: string, folderId: string | null) => void) | undefined;
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
        <h2 className="min-w-0 break-words text-[13px] font-semibold uppercase">{title}</h2>
        <span className="text-[13px] text-muted-foreground">{docs.length}</span>
      </div>
      {docs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className={preview ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-2 sm:grid-cols-2"}>
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} preview={preview} folders={folders} onMove={onMove} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
