import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import { supabase } from "@/integrations/supabase/client";
import { buildExtensions } from "@/lib/editor-extensions";
import type { DocKind } from "@/lib/scrap-types";

export const Route = createFileRoute("/s/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared from Scrap" },
      { name: "description", content: "A read-only note or page shared from Scrap." },
      { property: "og:title", content: "Shared from Scrap" },
      { property: "og:description", content: "A read-only note or page shared from Scrap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shared,
});

function Shared() {
  const { token } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_document", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  if (isLoading) return <div className="p-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-24 text-center text-sm text-muted-foreground">This link is no longer available.</div>;
  return <Reader title={data.title} content={data.content} kind={data.kind as DocKind} updated={data.updated_at} />;
}

function Reader({ title, content, kind, updated }: { title: string; content: unknown; kind: DocKind; updated: string }) {
  const editor = useEditor({
    extensions: buildExtensions(kind, false),
    content: content as object,
    editable: false,
    immediatelyRender: false,
  });
  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <article className="canvas-surface mx-auto max-w-3xl rounded-3xl px-6 py-10 sm:px-12">
        <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
          {kind === "note" ? "Note" : "Page"} · updated {new Date(updated).toLocaleDateString()}
        </p>
        <h1 className="mb-6 font-[family-name:var(--font-doc)] text-3xl font-semibold tracking-tight">{title || "Untitled"}</h1>
        <div className="scrap-editor">
          <EditorContent editor={editor} />
        </div>
      </article>
      <p className="mt-8 text-center text-xs text-muted-foreground">View only · shared with Scrap</p>
    </div>
  );
}
