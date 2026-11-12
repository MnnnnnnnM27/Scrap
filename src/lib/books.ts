import type { BookMetadata } from "./scrap-types";
import { EMPTY_BOOK } from "./scrap-types";
export function bookMetadata(value: unknown): BookMetadata {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { author: typeof v.author === "string" ? v.author : "", subtitle: typeof v.subtitle === "string" ? v.subtitle : "", front_cover: typeof v.front_cover === "string" ? v.front_cover : "", back_cover: typeof v.back_cover === "string" ? v.back_cover : "", blurb: typeof v.blurb === "string" ? v.blurb : "", word_target: typeof v.word_target === "number" && v.word_target > 0 ? Math.round(v.word_target) : EMPTY_BOOK.word_target };
}
/** Keep document nodes intact; long blocks continue onto another sheet. */
export function paginateBook(html: string, capacity = 280): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const pages: string[] = [];
  let blocks: string[] = []; let words = 0;
  for (const node of Array.from(doc.body.children)) {
    const size = Math.max(20, (node.textContent ?? "").trim().split(/\s+/).length);
    if (blocks.length && (words + size > capacity || node.tagName === "H1")) { pages.push(blocks.join("")); blocks = []; words = 0; }
    blocks.push(node.outerHTML); words += size;
  }
  if (blocks.length) pages.push(blocks.join(""));
  return pages.length ? pages : ["<p></p>"];
}