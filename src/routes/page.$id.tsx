import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/scrap/AuthGate";
import { DocumentEditorScreen } from "@/components/scrap/DocumentEditor";

export const Route = createFileRoute("/page/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Page — Scrap" },
      { name: "description", content: "A long-form page in Scrap." },
      { property: "og:title", content: "Page — Scrap" },
      { property: "og:description", content: "A long-form page in Scrap." },
    ],
  }),
  component: PageRoute,
});

function PageRoute() {
  const { id } = Route.useParams();
  return (
    <AuthGate>
      <DocumentEditorScreen id={id} kind="page" />
    </AuthGate>
  );
}
