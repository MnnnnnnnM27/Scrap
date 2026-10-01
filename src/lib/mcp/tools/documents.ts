import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Row = { id: string; kind: string; title: string; plain_text: string; updated_at: string; folder_id: string | null };
const summary = (r: Row) => ({
  id: r.id,
  kind: r.kind,
  title: r.title || "Untitled",
  updated_at: r.updated_at,
  preview: (r.plain_text ?? "").slice(0, 160),
});

export const listDocumentsTool = defineTool({
  name: "list_documents",
  title: "List notes and pages",
  description: "List the signed-in user's notes and pages (not in Trash), newest first, optionally filtered by kind or search text.",
  inputSchema: {
    kind: z.enum(["note", "page"]).optional().describe("Only notes or only pages."),
    query: z.string().max(200).optional().describe("Text to search in titles and content."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, query, limit }, ctx) => {
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("documents")
      .select("id, kind, title, plain_text, updated_at, folder_id")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 25);
    if (kind) q = q.eq("kind", kind);
    if (query?.trim()) {
      const s = query.trim().replace(/[%,()]/g, " ");
      q = q.or(`title.ilike.%${s}%,plain_text.ilike.%${s}%`);
    }
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const docs = ((data ?? []) as Row[]).map(summary);
    return { content: [{ type: "text", text: JSON.stringify(docs) }], structuredContent: { documents: docs } };
  },
});

export const getDocumentTool = defineTool({
  name: "get_document",
  title: "Read a note or page",
  description: "Get the full title and text of one of the user's notes or pages by id.",
  inputSchema: { id: z.string().uuid().describe("Document id from list_documents.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("documents")
      .select("id, kind, title, plain_text, updated_at, folder_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Document not found");
    const r = data as Row;
    const doc = { id: r.id, kind: r.kind, title: r.title || "Untitled", updated_at: r.updated_at, text: r.plain_text ?? "" };
    return { content: [{ type: "text", text: `# ${doc.title}\n\n${doc.text}` }], structuredContent: { document: doc } };
  },
});

export const createDocumentTool = defineTool({
  name: "create_document",
  title: "Create a note or page",
  description: "Create a new note or page for the signed-in user with a title and plain-text body (blank lines separate paragraphs).",
  inputSchema: {
    kind: z.enum(["note", "page"]).describe("Create a short note or a long-form page."),
    title: z.string().max(300).describe("Document title."),
    text: z.string().max(100000).describe("Body text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ kind, title, text }, ctx) => {
    const sb = supabaseForUser(ctx);
    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const content = {
      type: "doc",
      content: paragraphs.length
        ? paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] }))
        : [{ type: "paragraph" }],
    };
    const { data, error } = await sb
      .from("documents")
      .insert({ user_id: ctx.getUserId(), kind, title, content, plain_text: paragraphs.join("\n") })
      .select("id")
      .single();
    if (error) throw new ToolError(error.message);
    return { content: [{ type: "text", text: `Created ${kind} ${data.id}` }], structuredContent: { id: data.id as string } };
  },
});
