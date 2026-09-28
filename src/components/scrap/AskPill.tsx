import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function friendlyError(e: Error) {
  const m = e.message.toLowerCase();
  if (m.includes("402") || m.includes("credit") || m.includes("payment"))
    return "AI credits are used up. Top up in Lovable to keep using Gemini.";
  if (m.includes("429") || m.includes("rate")) return "Gemini is busy — try again in a few seconds.";
  return "Gemini couldn't answer right now. Try again.";
}

export function AskPill({
  getBody,
  kind,
  onClose,
}: {
  getBody: () => Record<string, unknown>;
  kind: string;
  onClose: () => void;
}) {
  const bodyRef = useRef(getBody);
  bodyRef.current = getBody;
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => bodyRef.current() }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const expanded = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text });
    setInput("");
  };

  return (
    <div
      role="dialog"
      aria-label="Ask Gemini"
      className={cn(
        "animate-pill-in fixed top-16 right-4 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden border border-border bg-popover text-popover-foreground shadow-lift transition-[border-radius] duration-300",
        expanded ? "rounded-3xl" : "rounded-full",
      )}
    >
      {expanded && (
        <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-y-auto px-4 pt-4 pb-2">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl bg-brand-soft px-3 py-1.5 text-[13px] text-foreground"
                    : "text-[14px] leading-relaxed whitespace-pre-wrap"
                }
              >
                {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
              </div>
            </div>
          ))}
          {status === "submitted" && <p className="animate-pulse text-[13px] text-muted-foreground">Thinking…</p>}
          {error && <p className="text-[13px] text-destructive">{friendlyError(error)}</p>}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className={cn("flex items-center gap-1.5 py-1.5 pr-1.5 pl-3.5", expanded && "border-t border-border")}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand" />
        <input
          autoFocus
          aria-label={`Ask Gemini about this ${kind}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={expanded ? "Follow up…" : `Ask about this ${kind}…`}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] outline-none placeholder:text-muted-foreground"
        />
        {input.trim() ? (
          <button type="submit" disabled={busy} aria-label="Send" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-40">
            <ArrowUp className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      {!expanded && null}
    </div>
  );
}
