import { generateJSON } from "@tiptap/core";
import { buildExtensions } from "./editor-extensions";
import { markdownToHtml } from "./markdown-html";
import type { DocKind } from "./scrap-types";

export const ACCEPTED = [".md", ".markdown", ".txt", ".docx", ".pdf"];

export function isImportable(file: File) {
  const n = file.name.toLowerCase();
  return ACCEPTED.some((ext) => n.endsWith(ext));
}

export type Imported = { title: string; html: string; suggestedKind: DocKind };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function pdfToHtml(file: File): Promise<{ html: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    // group text items into lines by y position, then lines into paragraphs by gaps
    type Line = { y: number; text: string; size: number };
    const lines: Line[] = [];
    for (const it of tc.items as { str: string; transform: number[]; height: number }[]) {
      if (!("str" in it)) continue;
      const y = Math.round(it.transform[5] ?? 0);
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - y) < 3) last.text += it.str;
      else lines.push({ y, text: it.str, size: it.height || 10 });
    }
    const sizes = lines.map((l) => l.size).sort((a, b) => a - b);
    const body = sizes[Math.floor(sizes.length / 2)] || 10;
    let para: string[] = [];
    let prevY: number | null = null;
    const flush = () => {
      if (para.length) out.push(`<p>${esc(para.join(" ").replace(/\s+/g, " ").trim())}</p>`);
      para = [];
    };
    for (const l of lines) {
      const t = l.text.trim();
      if (!t) { flush(); prevY = l.y; continue; }
      if (l.size > body * 1.5 && t.length < 120) { flush(); out.push(`<h1>${esc(t)}</h1>`); }
      else if (l.size > body * 1.2 && t.length < 120) { flush(); out.push(`<h2>${esc(t)}</h2>`); }
      else {
        if (prevY !== null && prevY - l.y > l.size * 1.8) flush();
        para.push(t);
      }
      prevY = l.y;
    }
    flush();
  }
  return { html: out.join(""), pages: pdf.numPages };
}

export async function readFile(file: File): Promise<Imported> {
  const name = file.name.toLowerCase();
  const title = file.name.replace(/\.[^.]+$/, "");
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    return { title, html: value, suggestedKind: "page" };
  }
  if (name.endsWith(".pdf")) {
    const { html, pages } = await pdfToHtml(file);
    return { title, html, suggestedKind: pages > 1 ? "page" : "note" };
  }
  const text = await file.text();
  return { title, html: markdownToHtml(text), suggestedKind: text.length > 3000 ? "page" : "note" };
}

export function htmlToDoc(html: string, kind: DocKind) {
  return generateJSON(html || "<p></p>", buildExtensions(kind, false));
}
