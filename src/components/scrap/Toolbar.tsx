import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Underline,
} from "lucide-react";
import type { ReactNode } from "react";
import type { DocKind } from "@/lib/scrap-types";
import { PAGE_FONT_FAMILIES } from "@/lib/scrap-types";

const SIZES = ["14px", "16px", "18px", "20px", "24px", "32px"];

function Btn({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-1.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-brand text-brand-foreground" : "text-brand hover:bg-brand-soft"
      }`}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor, kind }: { editor: Editor; kind: DocKind }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      heading: ([1, 2, 3, 4, 5, 6] as const).find((l) => e.isActive("heading", { level: l })) ?? 0,
      align: (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
      font: (e.getAttributes("textStyle")['fontFamily'] as string | undefined) ?? "",
      size: (e.getAttributes("textStyle")['fontSize'] as string | undefined) ?? "",
    }),
  });
  const c = () => editor.chain().focus();
  const levels = kind === "note" ? ([1, 2] as const) : ([1, 2, 3, 4, 5, 6] as const);
  const sep = <div className="my-1 h-px w-full bg-border" />;

  return (
    <div className="glass fixed top-1/2 right-3 z-30 flex max-h-[75vh] w-[52px] -translate-y-1/2 flex-col items-center gap-0.5 overflow-y-auto rounded-2xl p-1.5 sm:right-5">
      {kind === "page" && (
        <>
          <select
            aria-label="Font"
            value={s.font}
            onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
            className="w-full rounded-lg bg-transparent py-1 text-[11px] text-brand outline-none"
          >
            {PAGE_FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            aria-label="Font size"
            value={s.size}
            onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
            className="w-full rounded-lg bg-transparent py-1 text-[11px] text-brand outline-none"
          >
            <option value="">Size</option>
            {SIZES.map((z) => (
              <option key={z} value={z}>{parseInt(z)}</option>
            ))}
          </select>
          {sep}
        </>
      )}
      {levels.map((l) => (
        <Btn key={l} label={`Heading ${l}`} active={s.heading === l} onClick={() => c().toggleHeading({ level: l }).run()}>
          H{l}
        </Btn>
      ))}
      {sep}
      <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
      <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
      {kind === "page" && (
        <Btn label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}><Underline className="h-4 w-4" /></Btn>
      )}
      {sep}
      <Btn label="Bullet list" active={s.bullet} onClick={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
      {kind === "note" && (
        <Btn label="Checklist" active={s.task} onClick={() => c().toggleTaskList().run()}><ListChecks className="h-4 w-4" /></Btn>
      )}
      {kind === "page" && (
        <>
          {sep}
          <Btn label="Align left" active={s.align === "left"} onClick={() => c().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
          <Btn label="Align center" active={s.align === "center"} onClick={() => c().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
          <Btn label="Align right" active={s.align === "right"} onClick={() => c().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
          <Btn label="Justify" active={s.align === "justify"} onClick={() => c().setTextAlign("justify").run()}><AlignJustify className="h-4 w-4" /></Btn>
        </>
      )}
    </div>
  );
}
