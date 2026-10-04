import type { Editor } from "@tiptap/react";
import { markdownToHtml } from "./markdown-html";

/** Runs an AI document-edit tool against the live editor. Returns a short result string. */
export function applyDocTool(editor: Editor, name: string, input: Record<string, unknown>): string {
  if (name === "insert_text") {
    const html = markdownToHtml(String(input["markdown"] ?? ""));
    const pos = input["position"];
    const chain = editor.chain().focus();
    if (pos === "end") chain.setTextSelection(editor.state.doc.content.size);
    if (pos === "start") chain.setTextSelection(0);
    chain.insertContent(html).run();
    return "inserted";
  }
  if (name === "replace_document") {
    editor.chain().focus().setContent(markdownToHtml(String(input["markdown"] ?? "")), { emitUpdate: true }).run();
    return "replaced document";
  }
  if (name === "replace_text") {
    const find = String(input["find"] ?? "");
    const replace = String(input["replace"] ?? "");
    if (!find) return "nothing to find";
    let found: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (found || !node.isText || !node.text) return !found;
      const i = node.text.indexOf(find);
      if (i >= 0) found = { from: pos + i, to: pos + i + find.length };
      return !found;
    });
    if (!found) return "text not found — no change";
    const f = found as { from: number; to: number };
    editor.chain().focus().insertContentAt(f, replace).run();
    return "replaced";
  }
  return "unknown tool";
}
