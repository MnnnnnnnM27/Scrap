import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "./ChatThread";
import { getDocument, listDocuments, syncOfflineSaves, stageDocumentSave } from "@/lib/documents";
import { activeEditor } from "@/lib/active-editor";
import { buildExtensions } from "@/lib/editor-extensions";
import { useSettings } from "@/lib/settings";
import type { ScrapDocument } from "@/lib/scrap-types";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

export function SplitPane({ primaryId, onClose }: { primaryId: string; onClose: () => void }) {
  const [selected, setSelected] = useState("research");
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments() });
  const { data: doc, isLoading, error } = useQuery({ queryKey: ["document", selected], queryFn: () => getDocument(selected), enabled: selected !== "research", staleTime: 0 });
  return <aside aria-label="Companion pane" className="split-companion flex min-h-0 min-w-0 flex-col border-border bg-background md:border-l">
    <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
      <select aria-label="Companion document" className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-2 text-sm" value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="research">Research</option>{docs.filter(item => item.id !== primaryId).map(item => <option key={item.id} value={item.id}>{item.title || "Untitled"}</option>)}
      </select>
      <Button variant="ghost" size="icon" aria-label="Close split view" title="Close split view" onClick={onClose}><X /></Button>
    </header>
    {selected === "research" ? <div className="min-h-0 flex-1 p-4"><ChatThread placeholder="Ask Gemini…" /></div> : isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : error || !doc || doc.deleted_at ? <p role="status" className="p-6 text-sm text-muted-foreground">This document isn't available.</p> : <CompanionEditor key={doc.id} doc={doc} />}
  </aside>;
}

function CompanionEditor({ doc }: { doc: ScrapDocument }) {
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [title, setTitle] = useState(doc.title);
  const pending = useRef<{ title?: string; content?: Json; plain_text?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = () => { clearTimeout(timer.current); const patch = pending.current; pending.current = {}; if (Object.keys(patch).length) void syncOfflineSaves().then(() => qc.invalidateQueries({ queryKey: ["documents"] })).catch(() => toast.error("Couldn't sync this page.")); };
  const flushRef = useRef(flush); flushRef.current = flush;
  const queue = (patch: typeof pending.current) => { try { stageDocumentSave(doc.id, patch); } catch { toast.error("Device storage is full."); } pending.current = { ...pending.current, ...patch }; clearTimeout(timer.current); timer.current = setTimeout(() => flushRef.current(), 700); };
  const editor = useEditor({ extensions: buildExtensions(doc.kind), content: doc.content as object, immediatelyRender: false,
    editorProps: { attributes: { spellcheck: String(settings.spellcheck), "aria-label": "Companion text" } },
    onFocus: ({ editor: focused }) => { activeEditor.current = focused; },
    onUpdate: ({ editor: changed }) => queue({ content: changed.getJSON() as Json, plain_text: changed.getText() }),
  });
  useEffect(() => () => { flushRef.current(); if (activeEditor.current === editor) activeEditor.current = null; }, [editor]);
  useEffect(() => { editor?.view.dom.setAttribute("spellcheck", String(settings.spellcheck)); }, [editor, settings.spellcheck]);
  return <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8" data-doc-font={settings.font}>
    <input aria-label="Companion title" value={title} placeholder="Untitled" onChange={event => { setTitle(event.target.value); queue({ title: event.target.value }); }} className="mb-6 w-full bg-transparent text-2xl font-semibold outline-none" />
    <div className="scrap-editor"><EditorContent editor={editor} /></div>
  </div>;
}