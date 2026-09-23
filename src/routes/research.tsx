import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Sparkles } from "lucide-react";
import { AuthGate } from "@/components/scrap/AuthGate";
import { ChatThread } from "@/components/scrap/ChatThread";
import { SettingsBubble } from "@/components/scrap/SettingsBubble";

export const Route = createFileRoute("/research")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Research — Scrap" },
      { name: "description", content: "Ask Gemini anything in Scrap's research mode." },
      { property: "og:title", content: "Research — Scrap" },
      { property: "og:description", content: "Ask Gemini anything in Scrap's research mode." },
    ],
  }),
  component: () => (
    <AuthGate>
      <Research />
    </AuthGate>
  ),
});

function Research() {
  return (
    <div className="flex h-screen flex-col">
      <SettingsBubble />
      <Link to="/" aria-label="Home" className="glass fixed top-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full text-brand">
        <Home className="h-5 w-5" />
      </Link>
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5 pt-24 pb-6">
        <ChatThread
          placeholder="Ask anything…"
          empty={
            <div className="flex flex-col items-center pt-16 text-center">
              <Sparkles className="mb-4 h-7 w-7 text-brand" />
              <h1 className="text-2xl font-semibold tracking-tight">Research</h1>
              <p className="mt-2 text-[15px] text-muted-foreground">Ask Gemini anything. This chat isn't tied to any note or page.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
