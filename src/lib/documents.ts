import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { DocKind, FolderColor, ScrapDocument, ScrapFolder } from "./scrap-types";
import { acknowledgeSave, cachedDocuments, cacheDocuments, forgetCachedDocument, offlineAccount, offlineQueue, setOfflineAccount, stageDocumentSave, type SavePatch } from "./offline-store";
export { stageDocumentSave } from "./offline-store";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

const offline = () => typeof navigator !== "undefined" && !navigator.onLine;
async function accountReady() {
  const { data } = await supabase.auth.getSession();
  setOfflineAccount(data.session?.user.id ?? null);
  if (!data.session) throw new Error("Not signed in");
}
let syncPromise: Promise<number> | null = null;

export function pendingOfflineSaves() {
  return Object.keys(offlineQueue()).length;
}

export async function syncOfflineSaves(): Promise<number> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    await accountReady();
    const user = offlineAccount();
    let count = 0;
    for (const [id, entry] of Object.entries(offlineQueue())) {
      if (offline() || offlineAccount() !== user) break;
      const { data, error } = await supabase.from("documents").update(entry.patch).eq("id", id).select("id").maybeSingle();
      if (error || !data || offlineAccount() !== user) break;
      acknowledgeSave(id, entry.revision); count++;
    }
    return count;
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

export async function listDocuments(trashed = false): Promise<ScrapDocument[]> {
  await accountReady();
  if (offline() && !trashed) return Object.values(cachedDocuments()).filter(doc => !doc.deleted_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  try {
    let query = supabase.from("documents").select("*").order("updated_at", { ascending: false });
    query = trashed ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
    const { data, error } = await query;
    if (error) throw error;
    if (!trashed) cacheDocuments((data ?? []) as ScrapDocument[], true);
    return ((data ?? []) as ScrapDocument[]).map(doc => ({ ...doc, ...offlineQueue()[doc.id]?.patch }));
  } catch (e) {
    if (trashed || !offline()) throw e;
    return Object.values(cachedDocuments())
      .filter((d) => !d.deleted_at)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
}

export async function getDocument(id: string): Promise<ScrapDocument | null> {
  await accountReady();
  if (offline()) return cachedDocuments()[id] ?? null;
  try {
    const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) cacheDocuments([data as ScrapDocument]);
    return data ? { ...(data as ScrapDocument), ...offlineQueue()[id]?.patch } : null;
  } catch (e) {
    const cached = cachedDocuments()[id];
    if (!offline() || !cached) throw e;
    const patch = offlineQueue()[id]?.patch;
    return { ...cached, ...(patch as Partial<ScrapDocument>) };
  }
}

export async function createDocument(
  kind: DocKind,
  init?: { title: string; content: Json; plain_text: string },
): Promise<ScrapDocument> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: auth.user.id,
      kind,
      title: init?.title ?? "",
      content: init?.content ?? EMPTY_DOC,
      plain_text: init?.plain_text ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  await accountReady();
  cacheDocuments([data as ScrapDocument]);
  return data as ScrapDocument;
}

export async function saveDocument(
  id: string,
  patch: SavePatch,
): Promise<void> {
  await accountReady();
  stageDocumentSave(id, patch);
  if (offline()) return;
  await syncOfflineSaves();
}

export async function trashDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  forgetCachedDocument(id);
}

export async function restoreDocument(id: string): Promise<void> {
  const { error } = await supabase.from("documents").update({ deleted_at: null }).eq("id", id);
  if (error) throw error;
}

export async function destroyDocument(id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function getOrCreateShareLink(documentId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("share_links")
    .select("token")
    .eq("document_id", documentId)
    .is("revoked_at", null)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("share_links")
    .insert({ document_id: documentId, user_id: auth.user.id })
    .select("token")
    .single();
  if (error) throw error;
  return data.token as string;
}

export async function revokeShareLinks(documentId: string): Promise<void> {
  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("document_id", documentId)
    .is("revoked_at", null);
  if (error) throw error;
}

export async function listFolders(): Promise<ScrapFolder[]> {
  const { data, error } = await supabase.from("folders").select("*").order("position").order("created_at");
  if (error) throw error;
  return (data ?? []) as ScrapFolder[];
}

export async function createFolder(name: string, color: FolderColor): Promise<ScrapFolder> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("folders").insert({ user_id: auth.user.id, name, color }).select("*").single();
  if (error) throw error;
  return data as ScrapFolder;
}

export async function updateFolder(id: string, patch: { name?: string; color?: FolderColor }): Promise<void> {
  const { error } = await supabase.from("folders").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function moveToFolder(docId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase.from("documents").update({ folder_id: folderId }).eq("id", docId);
  if (error) throw error;
}

export async function getOrCreateCollabLink(documentId: string): Promise<string> {
  const { data } = await supabase.from("documents").select("collab_token").eq("id", documentId).maybeSingle();
  let token = (data?.collab_token as string | null) ?? null;
  if (!token) {
    token = crypto.randomUUID();
    const { error } = await supabase.from("documents").update({ collab_token: token }).eq("id", documentId);
    if (error) throw error;
  }
  return `${window.location.origin}/join/${token}`;
}

export async function joinCollab(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("join_collab", { _token: token });
  if (error) throw error;
  return data as string;
}

export async function leaveCollab(documentId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("document_collaborators")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", auth.user.id);
  if (error) throw error;
}

export type DocPerson = { document_id: string; user_id: string; username: string; color: string; is_owner: boolean };

export async function docPeople(ids: string[]): Promise<DocPerson[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.rpc("doc_people", { _docs: ids });
  if (error) throw error;
  return (data ?? []) as DocPerson[];
}
