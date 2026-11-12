import { expect, it } from "vitest";
import { searchDocuments } from "./spotlight";
import type { ScrapDocument } from "./scrap-types";
const docs = [{ id: "1", kind: "page", title: "Book", plain_text: "apple", updated_at: "2026", deleted_at: null }, { id: "2", kind: "note", title: "Apple", plain_text: "", updated_at: "2025", deleted_at: null }, { id: "3", kind: "page", title: "Apple deleted", plain_text: "", updated_at: "2026", deleted_at: "2026" }] as ScrapDocument[];
it("searches Notes and Pages together, excluding Trash", () => { expect(searchDocuments(docs, "apple").map(d => d.id)).toEqual(["2", "1"]); });
it("respects Pages-only mode", () => { expect(searchDocuments(docs, "apple", true).map(d => d.id)).toEqual(["1"]); });