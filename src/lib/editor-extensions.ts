import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import type { DocKind } from "./scrap-types";

export function buildExtensions(kind: DocKind, placeholder = true) {
  const base = [
    StarterKit.configure({
      heading: { levels: kind === "note" ? [1, 2] : [1, 2, 3, 4, 5, 6] },
      link: false,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextStyle,
    FontFamily,
    FontSize,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];
  if (placeholder) {
    base.push(
      Placeholder.configure({
        placeholder: kind === "note" ? "Jot something down…" : "Start writing…",
      }) as never,
    );
  }
  return base;
}
