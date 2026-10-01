import { auth, defineMcp } from "@lovable.dev/mcp-js";
import { createDocumentTool, getDocumentTool, listDocumentsTool } from "./tools/documents";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "scrap",
  title: "Scrap",
  version: "0.1.0",
  instructions:
    "Tools for Scrap, a notes and pages writing app. Use `list_documents` to find notes/pages, `get_document` to read one, and `create_document` to save new writing.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listDocumentsTool, getDocumentTool, createDocumentTool],
});
