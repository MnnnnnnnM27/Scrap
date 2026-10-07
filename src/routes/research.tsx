import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Home, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { AuthGate } from "@/components/scrap/AuthGate";
import { ChatThread } from "@/components/scrap/ChatThread";
import { SettingsBubble } from "@/components/scrap/SettingsBubble";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { deleteChat, getChat, listChats, type SavedChat } from "@/lib/chat-history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Research — Scrap" },
      { name: "description", content: "Ask Gemini anything in Scrap's research mode." },
      { property: "og:title", content: "Research — Scrap" },
      { property: "og:description", content: "Ask Gemini anything in Scrap's research mode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <Research />
    </AuthGate>
  ),
});

function Research() {
  const [chatId, setChatId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<SavedChat[]>([]);
  const openHistory = () => {
    setChats(listChats());
    setOpen(true);
  };
  const newChat = () => {
    setChatId(crypto.randomUUID());
    setOpen(false);
  };
  const btn = "glass flex h-11 w-11 items-center justify-center rounded-full text-brand transition-transform hover:scale-105 active:scale-95";

  return (
    <div className="flex h-screen flex-col">
      <SettingsBubble />
      <div className="fixed top-5 right-5 z-40 flex gap-2">
        <button type="button" aria-label="Chat history" onClick={openHistory} className={btn}>
          <History className="h-5 w-5" />
        </button>
        <Link to="/" aria-label="Home" className={btn}>
          <Home className="h-5 w-5" />
        </Link>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[320px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[17px] tracking-tight">Chats</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 px-3 pb-8">
            <button type="button" onClick={newChat} className="mb-3 flex w-full items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> New chat
            </button>
            {chats.length === 0 && <p className="px-2 text-sm text-muted-foreground">No chats yet.</p>}
            {chats.map((c) => (
              <div key={c.id} className={cn("group flex items-center rounded-xl hover:bg-accent", c.id === chatId && "bg-accent")}>
                <button
                  type="button"
                  onClick={() => { setChatId(c.id); setOpen(false); }}
                  className="min-w-0 flex-1 px-3 py-2 text-left"
                >
                  <span className="block truncate text-sm">{c.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {c.source === "doc" ? "In a document" : "Research"} · {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete chat"
                  onClick={() => { deleteChat(c.id); setChats(listChats()); }}
                  className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5 pt-24 pb-6">
        <ChatThread
          key={chatId}
          chatId={chatId}
          initialMessages={getChat(chatId)?.messages}
          placeholder="Ask anything…"
          empty={
            <div className="flex flex-col items-center pt-16 text-center">
              <Sparkles className="mb-4 h-7 w-7 text-brand" />
              <h1 className="text-2xl font-semibold tracking-tight">Research</h1>
              <p className="mt-2 text-[15px] text-muted-foreground">Ask Gemini anything. Past chats live in the clock icon.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
