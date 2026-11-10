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
  Type,
  Underline,
} from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/lib/settings";
import type { DocKind } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";

const SIZES = ["14px", "16px", "18px", "20px", "24px", "32px"];

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-semibold transition-colors",
        active ? "bg-brand text-brand-foreground" : "text-brand hover:bg-brand-soft",
      )}
    >
      {children}
    </button>
  );
}

function Row({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        active ? "bg-brand-soft text-brand" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor, kind }: { editor: Editor; kind: DocKind }) {
  const { settings } = useSettings();
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
      align:
        (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ??
        "left",
      font: (e.getAttributes("textStyle")['fontFamily'] as string | undefined) ?? "",
      size: (e.getAttributes("textStyle")['fontSize'] as string | undefined) ?? "",
    }),
  });
  const c = () => editor.chain().focus();
  const levels = kind === "note" ? ([1, 2] as const) : ([1, 2, 3, 4, 5, 6] as const);
  const sep = <div className="my-1 h-px w-7 bg-border" />;
  const side = settings.toolbar_side;

  return (
    <div
      className={cn(
        "glass fixed top-1/2 z-30 flex w-[52px] -translate-y-1/2 flex-col items-center gap-0.5 rounded-2xl p-1.5",
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5",
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Text options"
            title="Text options"
            onMouseDown={(e) => e.preventDefault()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand transition-colors hover:bg-brand-soft"
          >
            <Type className="h-[18px] w-[18px]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={side === "left" ? "right" : "left"}
          align="start"
          className="w-60 space-y-3 p-2.5"
        >
          {kind === "page" && (
            <>
              <div className="space-y-1">
                <p className="px-1 text-[11px] tracking-wide text-muted-foreground uppercase">Size</p>
                <select
                  aria-label="Font size"
                  value={s.size}
                  onChange={(e) =>
                    e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run()
                  }
                  className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none"
                >
                  <option value="">Default</option>
                  {SIZES.map((z) => (
                    <option key={z} value={z}>
                      {parseInt(z)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-0.5">
            <p className="px-1 text-[11px] tracking-wide text-muted-foreground uppercase">Style</p>
            <Row active={s.bold} onClick={() => c().toggleBold().run()}>
              <span className="font-bold">Bold</span>
              <Bold className="h-4 w-4" />
            </Row>
            <Row active={s.italic} onClick={() => c().toggleItalic().run()}>
              <span className="italic">Italic</span>
              <Italic className="h-4 w-4" />
            </Row>
            {kind === "page" && (
              <Row active={s.underline} onClick={() => c().toggleUnderline().run()}>
                <span className="underline">Underline</span>
                <Underline className="h-4 w-4" />
              </Row>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="px-1 text-[11px] tracking-wide text-muted-foreground uppercase">Heading</p>
            <div className="flex flex-wrap gap-1">
              <Btn
                label="Body text"
                active={s.heading === 0}
                onClick={() => c().setParagraph().run()}
              >
                ¶
              </Btn>
              {levels.map((l) => (
                <Btn
                  key={l}
                  label={`Heading ${l}`}
                  active={s.heading === l}
                  onClick={() => c().toggleHeading({ level: l }).run()}
                >
                  H{l}
                </Btn>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {sep}
      <Btn label="Bullet list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      {kind === "note" && (
        <Btn label="Checklist" active={s.task} onClick={() => c().toggleTaskList().run()}>
          <ListChecks className="h-4 w-4" />
        </Btn>
      )}

      {kind === "page" && (
        <>
          {sep}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Alignment"
                title="Alignment"
                onMouseDown={(e) => e.preventDefault()}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-brand transition-colors hover:bg-brand-soft"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side={side === "left" ? "right" : "left"}
              align="center"
              className="flex w-auto gap-1 p-1.5"
            >
              <Btn label="Align left" active={s.align === "left"} onClick={() => c().setTextAlign("left").run()}>
                <AlignLeft className="h-4 w-4" />
              </Btn>
              <Btn label="Align center" active={s.align === "center"} onClick={() => c().setTextAlign("center").run()}>
                <AlignCenter className="h-4 w-4" />
              </Btn>
              <Btn label="Align right" active={s.align === "right"} onClick={() => c().setTextAlign("right").run()}>
                <AlignRight className="h-4 w-4" />
              </Btn>
              <Btn label="Justify" active={s.align === "justify"} onClick={() => c().setTextAlign("justify").run()}>
                <AlignJustify className="h-4 w-4" />
              </Btn>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}
