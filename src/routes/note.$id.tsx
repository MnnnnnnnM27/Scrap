import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/scrap/AuthGate";
import { DocumentEditorScreen } from "@/components/scrap/DocumentEditor";

export const Route = createFileRoute("/note/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Note — Scrap" },
      { name: "description", content: "A quick note in Scrap." },
      { property: "og:title", content: "Note — Scrap" },
      { property: "og:description", content: "A quick note in Scrap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NoteRoute,
});

function NoteRoute() {
  const { id } = Route.useParams();
  return (
    <AuthGate>
      <DocumentEditorScreen id={id} kind="note" />
    </AuthGate>
  );
}
