import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ChatThread({
  getBody,
  placeholder,
  quickActions,
  empty,
}: {
  getBody?: () => Record<string, unknown>;
  placeholder: string;
  quickActions?: string[];
  empty?: React.ReactNode;
}) {
  const bodyRef = useRef(getBody);
  bodyRef.current = getBody;
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => bodyRef.current?.() ?? {},
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 && empty}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-brand px-4 py-2.5 text-[15px] text-brand-foreground"
                  : "text-[15px] leading-relaxed whitespace-pre-wrap"
              }
            >
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
        {status === "submitted" && <p className="text-sm text-muted-foreground">Thinking…</p>}
        {error && (
          <p className="text-sm text-destructive">The assistant couldn't respond right now. Try again in a moment.</p>
        )}
        <div ref={endRef} />
      </div>
      {quickActions && messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {quickActions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => send(a)}
              className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:border-brand hover:text-brand"
            >
              {a}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
