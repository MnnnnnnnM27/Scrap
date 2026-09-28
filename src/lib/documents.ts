import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { DocKind, FolderColor, ScrapDocument, ScrapFolder } from "./scrap-types";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export async function listDocuments(trashed = false): Promise<ScrapDocument[]> {
  let query = supabase.from("documents").select("*").order("updated_at", { ascending: false });
  query = trashed ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ScrapDocument[];
}

export async function getDocument(id: string): Promise<ScrapDocument | null> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ScrapDocument) ?? null;
}

export async function createDocument(kind: DocKind): Promise<ScrapDocument> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: auth.user.id,
      kind,
      title: "",
      content: EMPTY_DOC,
      plain_text: "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ScrapDocument;
}

export async function saveDocument(
  id: string,
  patch: { title?: string; content?: Json; plain_text?: string },
): Promise<void> {
  const { error } = await supabase.from("documents").update(patch).eq("id", id);
  if (error) throw error;
}

export async function trashDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
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
