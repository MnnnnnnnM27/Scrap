import { printDocument } from "@/lib/print-doc";
import type { Editor } from "@tiptap/react";
import {
  BarChart3, CheckSquare, Heading1, Heading2, Heading3, ImageIcon, List, ListOrdered,
  Minus, Printer, Quote, Sparkles, Table, Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateChart, generateImage, generateTable, writeForDoc } from "@/lib/ai.functions";
import { renderChartPng, fileToDataUrl } from "@/lib/chart-image";
import { markdownToHtml } from "@/lib/markdown-html";
import type { DocKind } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

export type TaskResult = { html?: string; image?: { src: string; alt: string } };
export type TaskKind = "aitable" | "chart" | "aiimage" | "ai";
export type StartTask = (label: string, job: () => Promise<TaskResult>, kind?: TaskKind) => void;

export type SlashState = { query: string; from: number; to: number; top: number; left: number };

type Item = {
  key: string;
  label: string;
  hint: string;
  icon: typeof List;
  ai?: string; // prompt placeholder when AI-driven
  run?: (e: Editor) => void;
};

function items(kind: DocKind, onAsk: () => void, onImage: () => void): Item[] {
  const list: Item[] = [
    { key: "h1", label: "Heading 1", hint: "Big title", icon: Heading1, run: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
    { key: "h2", label: "Heading 2", hint: "Section", icon: Heading2, run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  ];
  if (kind === "page") list.push({ key: "h3", label: "Heading 3", hint: "Subsection", icon: Heading3, run: (e) => e.chain().focus().setHeading({ level: 3 }).run() });
  list.push(
    { key: "bullet", label: "Bullet list", hint: "Simple list", icon: List, run: (e) => e.chain().focus().toggleBulletList().run() },
    { key: "numbered", label: "Numbered list", hint: "1, 2, 3", icon: ListOrdered, run: (e) => e.chain().focus().toggleOrderedList().run() },
  );
  if (kind === "note") list.push({ key: "check", label: "Checklist", hint: "To-dos", icon: CheckSquare, run: (e) => e.chain().focus().toggleTaskList().run() });
  list.push(
    { key: "quote", label: "Quote", hint: "Pull quote", icon: Quote, run: (e) => e.chain().focus().toggleBlockquote().run() },
    { key: "divider", label: "Divider", hint: "Line break", icon: Minus, run: (e) => e.chain().focus().setHorizontalRule().run() },
    { key: "table", label: "Table", hint: "3 × 3 grid", icon: Table, run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { key: "picture", label: "Picture", hint: "Upload image", icon: ImageIcon, run: () => onImage() },
    { key: "aitable", label: "AI table", hint: "Describe it", icon: Table, ai: "e.g. weekly workout plan" },
    { key: "chart", label: "AI chart", hint: "Describe it", icon: BarChart3, ai: "e.g. sales by month 2025" },
    { key: "aiimage", label: "AI image", hint: "Generate picture", icon: Wand2, ai: "e.g. a foggy pine forest" },
    { key: "ai", label: "Ask Gemini", hint: "Write here", icon: Sparkles, ai: "e.g. intro paragraph about bees" },
    { key: "pdf", label: "Print", hint: "Just the text", icon: Printer, run: (e) => printDocument("", e.getHTML()) },
  );
  return list;
}

export function SlashMenu({
  editor, kind, state, onClose, onAsk, keyRef, startTask,
}: {
  startTask: StartTask;
  editor: Editor;
  kind: DocKind;
  state: SlashState;
  onClose: () => void;
  onAsk: () => void;
  keyRef: React.MutableRefObject<((e: KeyboardEvent) => boolean) | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const [aiItem, setAiItem] = useState<Item | null>(null);
  const [prompt, setPrompt] = useState("");
  const busy = false as boolean;
  const table = useServerFn(generateTable);
  const chart = useServerFn(generateChart);
  const image = useServerFn(generateImage);
  const write = useServerFn(writeForDoc);

  const all = items(kind, onAsk, () => fileRef.current?.click());
  const q = state.query.toLowerCase();
  const shown = all.filter((i) => i.label.toLowerCase().includes(q) || i.key.includes(q));

  useEffect(() => setActive(0), [state.query]);

  const clearSlash = () => editor.chain().focus().deleteRange({ from: state.from, to: state.to }).run();

  const choose = (item: Item) => {
    if (item.ai) {
      setAiItem(item);
      return;
    }
    clearSlash();
    item.run?.(editor);
    if (item.key !== "picture") onClose();
  };

  const runAi = () => {
    if (!aiItem || !prompt.trim()) return;
    const context = editor.getText().slice(-3000);
    const p = prompt;
    const k = aiItem.key;
    clearSlash();
    onClose();
    startTask(p.length > 22 ? p.slice(0, 22) + "…" : p, async (): Promise<TaskResult> => {
      if (k === "aitable") {
        const r = await table({ data: { prompt: p, context } });
        if (r.error || !r.markdown) throw new Error(r.error ?? "No table");
        return { html: markdownToHtml(r.markdown) };
      }
      if (k === "chart") {
        const r = await chart({ data: { prompt: p, context } });
        if (!r.spec) throw new Error((r as { error?: string }).error ?? "No chart");
        return { image: { src: renderChartPng(r.spec), alt: r.spec.title } };
      }
      if (k === "ai") {
        const r = await write({ data: { prompt: p, context } });
        if (r.error || !r.markdown) throw new Error(r.error ?? "No answer");
        return { html: markdownToHtml(r.markdown) };
      }
      const r = await image({ data: { prompt: p } });
      if (r.error || !r.dataUrl) throw new Error(r.error ?? "No image");
      return { image: { src: r.dataUrl, alt: p } };
    }, k as TaskKind);
  };

  keyRef.current = (e) => {
    if (aiItem) return false;
    if (e.key === "ArrowDown") { setActive((a) => (a + 1) % Math.max(shown.length, 1)); return true; }
    if (e.key === "ArrowUp") { setActive((a) => (a - 1 + shown.length) % Math.max(shown.length, 1)); return true; }
    if (e.key === "Enter") { const it = shown[active]; if (it) { choose(it); return true; } return false; }
    if (e.key === "Escape") { onClose(); return true; }
    return false;
  };
  useEffect(() => () => { keyRef.current = null; }, [keyRef]);

  return (
    <div
      className="animate-pill-in no-print fixed z-50 w-64 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lift"
      style={{ top: state.top + 24, left: state.left }}
      onMouseDown={(e) => { if (!aiItem) e.preventDefault(); }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) editor.chain().focus().setImage({ src: await fileToDataUrl(f) }).run();
          onClose();
        }}
      />
      {aiItem ? (
        <form className="p-2" onSubmit={(e) => { e.preventDefault(); runAi(); }}>
          <p className="px-1.5 pb-1.5 text-xs font-medium text-muted-foreground">{aiItem.label}</p>
          <input
            autoFocus
            value={prompt}
            disabled={busy}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { onClose(); editor.commands.focus(); } }}
            placeholder={aiItem.ai}
            className="w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
          />
          <p className="px-1.5 pt-1.5 text-[11px] text-muted-foreground">Enter to start · keep writing while it works</p>
        </form>
      ) : shown.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No matches</p>
      ) : (
        <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox">
          {shown.map((it, i) => (
            <li key={it.key}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(it)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left", i === active && "bg-accent")}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-brand">
                  <it.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm">{it.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{it.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
