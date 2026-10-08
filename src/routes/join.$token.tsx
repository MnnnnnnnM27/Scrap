import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/scrap/AuthGate";
import { joinCollab } from "@/lib/documents";

export const Route = createFileRoute("/join/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a page — Scrap" },
      { name: "description", content: "You've been invited to write together on a Scrap page." },
      { property: "og:title", content: "Join a page — Scrap" },
      { property: "og:description", content: "You've been invited to write together on a Scrap page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <Join />
    </AuthGate>
  ),
});

function Join() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    joinCollab(token)
      .then((id) => navigate({ to: "/page/$id", params: { id }, replace: true }))
      .catch(() => setFailed(true));
  }, [token, navigate]);
  return (
    <div className="p-24 text-center text-sm text-muted-foreground">
      {failed ? "This invite isn't valid anymore." : "Joining…"}
    </div>
  );
}
