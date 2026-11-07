import type { Json } from "@/integrations/supabase/types";
import type { ScrapDocument } from "./scrap-types";

export type SavePatch = { title?: string; content?: Json; plain_text?: string };
type Entry = { patch: SavePatch; revision: number };
let account: string | null = null;
export function setOfflineAccount(id: string | null) { account = id; }
export function offlineAccount() { return account; }
function key(bucket: string) { if (!account) throw new Error("Not signed in"); return `scrap.offline.${account}.${bucket}`; }
function read<T>(bucket: string, fallback: T): T { if (!account || typeof localStorage === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(key(bucket)) || "null") ?? fallback; } catch { return fallback; } }
function write(bucket: string, value: unknown) { localStorage.setItem(key(bucket), JSON.stringify(value)); }
export function cachedDocuments() { return read<Record<string, ScrapDocument>>("docs", {}); }
export function offlineQueue() { return read<Record<string, Entry>>("queue", {}); }
export function cacheDocuments(docs: ScrapDocument[], replace = false) {
  const map = replace ? {} : cachedDocuments();
  const queue = offlineQueue();
  for (const doc of docs) map[doc.id] = { ...doc, ...queue[doc.id]?.patch };
  write("docs", map);
}
export function stageDocumentSave(id: string, patch: SavePatch) {
  const queue = offlineQueue();
  queue[id] = { patch: { ...queue[id]?.patch, ...patch }, revision: (queue[id]?.revision ?? 0) + 1 };
  write("queue", queue);
  const docs = cachedDocuments();
  if (docs[id]) { docs[id] = { ...docs[id], ...patch, updated_at: new Date().toISOString() }; write("docs", docs); }
}
export function acknowledgeSave(id: string, revision: number) {
  const queue = offlineQueue();
  if (queue[id]?.revision !== revision) return;
  delete queue[id]; write("queue", queue);
}
export function forgetCachedDocument(id: string) {
  const docs = cachedDocuments(); delete docs[id]; write("docs", docs);
  const queue = offlineQueue(); delete queue[id]; write("queue", queue);
}