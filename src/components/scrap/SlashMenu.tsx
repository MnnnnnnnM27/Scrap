import { printDocument } from "@/lib/print-doc";
import type { Editor } from "@tiptap/react";
import {
  BarChart3, CheckSquare, Heading1, Heading2, Heading3, ImageIcon, List, ListOrdered,
  Minus, Printer, Quote, Sparkles, Table, Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateChart, generateImage, generateTable } from "@/lib/ai.functions";
import { renderChartPng, fileToDataUrl } from "@/lib/chart-image";
import { markdownToHtml } from "@/lib/markdown-html";
import type { DocKind } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

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
    { key: "chart", label: "Chart", hint: "Bar, line, pie", icon: BarChart3, ai: "e.g. sales by month 2025" },
    { key: "aiimage", label: "AI image", hint: "Generate picture", icon: Wand2, ai: "e.g. a foggy pine forest" },
    { key: "ai", label: "Ask Gemini", hint: "Write or edit", icon: Sparkles, run: () => onAsk() },
    { key: "pdf", label: "Print / PDF", hint: "Save as PDF", icon: Printer, run: () => printDocument("", editor.getHTML()) },
  );
  return list;
}

export function SlashMenu({
  editor, kind, state, onClose, onAsk, keyRef,
}: {
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
  const [busy, setBusy] = useState(false);
  const table = useServerFn(generateTable);
  const chart = useServerFn(generateChart);
  const image = useServerFn(generateImage);

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

  const runAi = async () => {
    if (!aiItem || !prompt.trim() || busy) return;
    setBusy(true);
    const context = editor.getText().slice(-3000);
    try {
      if (aiItem.key === "aitable") {
        const r = await table({ data: { prompt, context } });
        if (r.error || !r.markdown) throw new Error(r.error ?? "No table");
        clearSlash();
        editor.chain().focus().insertContent(markdownToHtml(r.markdown)).run();
      } else if (aiItem.key === "chart") {
        const r = await chart({ data: { prompt, context } });
        if (!r.spec) throw new Error((r as { error?: string }).error ?? "No chart");
        clearSlash();
        editor.chain().focus().setImage({ src: renderChartPng(r.spec), alt: r.spec.title }).run();
      } else {
        const r = await image({ data: { prompt } });
        if (r.error || !r.dataUrl) throw new Error(r.error ?? "No image");
        clearSlash();
        editor.chain().focus().setImage({ src: r.dataUrl, alt: prompt }).run();
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gemini couldn't make that.");
      setBusy(false);
    }
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
        <form className="p-2" onSubmit={(e) => { e.preventDefault(); void runAi(); }}>
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
          <p className="px-1.5 pt-1.5 text-[11px] text-muted-foreground">{busy ? "Making it…" : "Enter to create · Esc to cancel"}</p>
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
