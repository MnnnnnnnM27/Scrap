import { docToMarkdown, type JSONNode } from "./doc-format";
import type { ScrapDocument } from "./scrap-types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(doc: ScrapDocument) {
  const base = (doc.title || "Untitled").replace(/[^\w\- ]+/g, "").trim() || "Untitled";
  return base.slice(0, 60);
}

export function exportMarkdown(doc: ScrapDocument) {
  download(
    new Blob([docToMarkdown(doc.content, doc.title)], { type: "text/markdown;charset=utf-8" }),
    `${safeName(doc)}.md`,
  );
}

/**
 * Placeholder .mnml container. Minimal Notes' real binary/plist layout is not
 * documented yet, so this keeps a self-describing JSON + Markdown payload that
 * can be swapped for the real format without touching the rest of the app.
 */
export function exportMnml(doc: ScrapDocument) {
  const payload = {
    format: "mnml",
    version: 1,
    generator: "Scrap",
    kind: doc.kind,
    title: doc.title || "Untitled",
    updatedAt: doc.updated_at,
    markdown: docToMarkdown(doc.content, doc.title),
    document: doc.content,
  };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
    `${safeName(doc)}.mnml`,
  );
}

export async function exportDocx(doc: ScrapDocument) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

  const headingFor = (level: number) =>
    [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ][Math.min(5, Math.max(0, level - 1))]!;

  const alignFor = (value: unknown) => {
    if (value === "center") return AlignmentType.CENTER;
    if (value === "right") return AlignmentType.RIGHT;
    if (value === "justify") return AlignmentType.JUSTIFIED;
    return AlignmentType.LEFT;
  };

  const runs = (node: JSONNode) =>
    (node.content ?? []).map((child) => {
      const marks = new Set((child.marks ?? []).map((m) => m.type));
      return new TextRun({
        text: child.text ?? "",
        bold: marks.has("bold"),
        italics: marks.has("italic"),
        strike: marks.has("strike"),
        ...(marks.has("underline") ? { underline: {} } : {}),
      });
    });

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  if (doc.title) {
    paragraphs.push(
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: doc.title })] }),
    );
  }

  const pushBlocks = (nodes: JSONNode[], bullet?: "bullet" | "number") => {
    for (const node of nodes) {
      switch (node.type) {
        case "heading":
          paragraphs.push(
            new Paragraph({
              heading: headingFor(Number(node.attrs?.['level'] ?? 1)),
              alignment: alignFor(node.attrs?.['textAlign']),
              children: runs(node),
            }),
          );
          break;
        case "paragraph":
          paragraphs.push(
            new Paragraph({
              alignment: alignFor(node.attrs?.['textAlign']),
              ...(bullet === "bullet" ? { bullet: { level: 0 } } : {}),
              ...(bullet === "number" ? { numbering: { reference: "scrap-ol", level: 0 } } : {}),
              children: runs(node),
            }),
          );
          break;
        case "bulletList":
        case "taskList":
          for (const li of node.content ?? []) pushBlocks(li.content ?? [], "bullet");
          break;
        case "orderedList":
          for (const li of node.content ?? []) pushBlocks(li.content ?? [], "bullet");
          break;
        case "blockquote":
          pushBlocks(node.content ?? []);
          break;
        case "codeBlock":
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: (node.content ?? []).map((c) => c.text).join("") })],
            }),
          );
          break;
        default:
          if (node.content) pushBlocks(node.content, bullet);
      }
    }
  };

  pushBlocks(((doc.content as JSONNode)?.content ?? []) as JSONNode[]);
  if (paragraphs.length === 0) paragraphs.push(new Paragraph({ children: [] }));

  const file = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(file);
  download(blob, `${safeName(doc)}.docx`);
}

export async function exportPng(doc: ScrapDocument, element: HTMLElement) {
  const { toPng } = await import("html-to-image");
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: bg || "#ffffff",
    style: { padding: "32px" },
  });
  const res = await fetch(dataUrl);
  download(await res.blob(), `${safeName(doc)}.png`);
}
