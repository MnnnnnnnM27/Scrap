import type { ScrapDocument } from "./scrap-types";
export function searchDocuments(docs: ScrapDocument[], query: string, pagesOnly = false) {
  const q = query.trim().toLowerCase();
  return docs.filter(d => !d.deleted_at && (!pagesOnly || d.kind === "page") && (!q || `${d.title} ${d.plain_text}`.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.title.toLowerCase().startsWith(q)) - Number(a.title.toLowerCase().startsWith(q)) || b.updated_at.localeCompare(a.updated_at)).slice(0, 40);
}