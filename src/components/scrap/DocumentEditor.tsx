import { printDocument } from "@/lib/print-doc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EditorContent, useEditor } from "@tiptap/react";
import { BarChart3, Columns2, Mic, Download, Link2, Sparkles, Table, Trash2, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplitPane } from "./SplitPane";
import { activeEditor } from "@/lib/active-editor";
import { readShortcuts } from "@/lib/shortcuts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AskPill } from "@/components/scrap/AskPill";
import { SlashMenu, type SlashState, type StartTask, type TaskKind } from "@/components/scrap/SlashMenu";
import { applyDocTool } from "@/lib/doc-actions";
import { Printer } from "lucide-react";
import { Toolbar } from "@/components/scrap/Toolbar";
import { TopBar } from "@/components/scrap/TopBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { completeText } from "@/lib/ai.functions";
import {
  getDocument,
  getOrCreateShareLink,
  revokeShareLinks,
  saveDocument,
  stageDocumentSave,
  trashDocument,
} from "@/lib/documents";
import { buildExtensions } from "@/lib/editor-extensions";
import { exportDocx, exportMarkdown, exportMnml, exportPdf, exportPng } from "@/lib/export";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useSettings } from "@/lib/settings";
import { CANVAS_WIDTHS, type DocKind, type ScrapDocument } from "@/lib/scrap-types";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

export function DocumentEditorScreen({ id, kind }: { id: string; kind: DocKind }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  if (isLoading) return <div className="p-24 text-center text-sm text-muted-foreground">Loading…</div>;
  if (error || !data || data.deleted_at)
    return <div className="p-24 text-center text-sm text-muted-foreground">This document isn't available.</div>;
  return <Editor key={data.id} doc={data} kind={kind} />;
}

function Editor({ doc, kind }: { doc: ScrapDocument; kind: DocKind }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [title, setTitle] = useState(doc.title);
  const titleRef = useRef(title);
  titleRef.current = title;
  const [askOpen, setAskOpen] = useState(false);
  const [split, setSplit] = useState(false);
  useEffect(() => { const toggle = () => setSplit(value => !value); window.addEventListener("scrap:split", toggle); return () => window.removeEventListener("scrap:split", toggle); }, []);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const slashKeyRef = useRef<((e: KeyboardEvent) => boolean) | null>(null);
  const [ghost, setGhost] = useState("");
  const [tasks, setTasks] = useState<{ id: string; label: string; kind: TaskKind; done?: boolean }[]>([]);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const startTask: StartTask = (label, job, taskKind = "ai") => {
    const e = editorRef.current;
    if (!e) return;
    const id = crypto.randomUUID();
    let pos = e.state.selection.from;
    const onTr = ({ transaction }: { transaction: { mapping: { map: (p: number) => number } } }) => { pos = transaction.mapping.map(pos); };
    e.on("transaction", onTr);
    setTasks((t) => [...t, { id, label, kind: taskKind }]);
    job()
      .then((r) => {
        const at = Math.min(pos, e.state.doc.content.size);
        if (r.html) e.chain().insertContentAt(at, r.html).run();
        else if (r.image) e.chain().insertContentAt(at, { type: "image", attrs: r.image }).run();
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Gemini couldn't make that."))
      .finally(() => {
        e.off("transaction", onTr);
        setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: true } : x)));
        setTimeout(() => setTasks((t) => t.filter((x) => x.id !== id)), 350);
      });
  };
  const [counts, setCounts] = useState({ words: 0, chars: 0 });
  const remoteApplying = useRef(false);
  const broadcastRef = useRef<((json: unknown) => void) | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ title?: string; content?: Json; plain_text?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ghostRef = useRef("");
  ghostRef.current = ghost;
  const suggestRef = useRef(settings.ghost_autocomplete);
  suggestRef.current = settings.ghost_autocomplete;
  const complete = useServerFn(completeText);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return;
    void saveDocument(doc.id, patch)
      .then(() => queryClient.invalidateQueries({ queryKey: ["documents"] }))
      .catch(() => toast.error("Couldn't save — check your connection."));
  }, [doc.id, queryClient]);

  const queue = useCallback(
    (patch: typeof pending.current) => {
      try { stageDocumentSave(doc.id, patch); } catch { toast.error("Device storage is full — keep this page open until it syncs."); }
      pending.current = { ...pending.current, ...patch };
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush],
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const track = (e: NonNullable<ReturnType<typeof useEditor>>) => {
    const { $from, empty } = e.state.selection;
    if (settingsRef.current.typeliner && e.isFocused) {
      requestAnimationFrame(() => {
        const c = e.view.coordsAtPos(e.state.selection.from);
        const d = c.top - window.innerHeight / 2;
        if (Math.abs(d) > 4) window.scrollBy({ top: d, behavior: "auto" });
      });
    }
    if (!settingsRef.current.slash_commands || !empty) return setSlash(null);
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
    const trigger = readShortcuts().slashTrigger;
    if (!before.startsWith(trigger) || !/^\w*$/.test(before.slice(trigger.length))) return setSlash(null);
    const c = e.view.coordsAtPos($from.pos);
    setSlash({ query: before.slice(trigger.length), from: $from.pos - before.length, to: $from.pos, top: c.top, left: c.left });
  };

  const editor = useEditor({
    extensions: buildExtensions(kind),
    content: doc.content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none" },
      handleKeyDown: (view, event) => {
        if (slashKeyRef.current?.(event)) {
          event.preventDefault();
          return true;
        }
        if (event.key === "Tab" && ghostRef.current) {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(ghostRef.current));
          setGhost("");
          return true;
        }
        if (event.key === "Escape") setGhost("");
        return false;
      },
    },
    onSelectionUpdate: ({ editor: e }) => track(e),
    onFocus: ({ editor: e }) => { activeEditor.current = e; },
    onUpdate: ({ editor: e }) => {
      if (!remoteApplying.current) broadcastRef.current?.(e.getJSON());
      queue({ content: e.getJSON() as Json, plain_text: e.getText() });
      track(e);
      const text = e.getText();
      setCounts({ words: text.trim() ? text.trim().split(/\s+/).length : 0, chars: text.length });
      setGhost("");
      clearTimeout(aiTimer.current);
      if (!suggestRef.current) return;
      const { from, to } = e.state.selection;
      if (from !== to || from !== e.state.doc.content.size - 1) return; // only at end of doc
      const before = text;
      aiTimer.current = setTimeout(async () => {
        try {
          const res = await complete({ data: { before: before.slice(-4000), kind } });
          if (suggestRef.current && e.getText() === before && res.suggestion) {
            setGhost((before.endsWith(" ") || res.suggestion.startsWith(" ") ? "" : " ") + res.suggestion);
          }
        } catch {
          /* autocomplete is best-effort */
        }
      }, 1400);
    },
  });

  editorRef.current = editor;
  useEffect(() => { if (editor) activeEditor.current = editor; return () => { if (activeEditor.current === editor) activeEditor.current = null; }; }, [editor]);

  // spellcheck lives on the editable element itself
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("spellcheck", String(settings.spellcheck));
    editor.view.dom.setAttribute("autocorrect", settings.spellcheck ? "on" : "off");
  }, [editor, settings.spellcheck]);

  // ---- live collaboration (pages) ----
  const { user } = useAuth();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor || !user || kind !== "page") return;
    const channel = supabase.channel(`doc:${doc.id}`, { config: { presence: { key: user.id }, broadcast: { self: false } } });
    const me = () => ({
      name: settingsRef.current.username || user.email?.split("@")[0] || "Someone",
      color: settingsRef.current.collab_color,
      pos: editor.state.selection.from,
    });
    let last = 0;
    let pendingJson: unknown = null;
    let t: ReturnType<typeof setTimeout> | undefined;
    const send = () => {
      last = Date.now();
      void channel.send({ type: "broadcast", event: "content", payload: { json: pendingJson } });
    };
    broadcastRef.current = (json) => {
      pendingJson = json;
      clearTimeout(t);
      if (Date.now() - last > 200) send();
      else t = setTimeout(send, 200);
    };
    channel
      .on("broadcast", { event: "content" }, ({ payload }) => {
        const sel = editor.state.selection.from;
        remoteApplying.current = true;
        editor.commands.setContent(payload.json as object, { emitUpdate: false });
        remoteApplying.current = false;
        editor.commands.setTextSelection(Math.min(sel, editor.state.doc.content.size - 1));
        setTick((n) => n + 1);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string; color: string; pos: number }>();
        setPeers(
          Object.entries(state)
            .filter(([k]) => k !== user.id)
            .flatMap(([k, v]) => { const peer = v[v.length - 1]; return peer ? [{ id: k, ...peer }] : []; }),
        );
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track(me());
      });
    const onSel = () => void channel.track(me());
    editor.on("selectionUpdate", onSel);
    return () => {
      editor.off("selectionUpdate", onSel);
      broadcastRef.current = null;
      clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, [editor, user, kind, doc.id]);

  const caretFor = (p: Peer) => {
    if (!editor || !canvasRef.current) return null;
    try {
      const c = editor.view.coordsAtPos(Math.min(p.pos, editor.state.doc.content.size - 1));
      const r = canvasRef.current.getBoundingClientRect();
      return { top: c.top - r.top, left: c.left - r.left, height: c.bottom - c.top };
    } catch {
      return null;
    }
  };
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "p" && editorRef.current) {
        ev.preventDefault();
        printDocument(titleRef.current, editorRef.current.getHTML());
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    setCounts({ words: text.trim() ? text.trim().split(/\s+/).length : 0, chars: text.length });
  }, [editor]);

  useEffect(() => () => { clearTimeout(aiTimer.current); flush(); }, [flush]);
  useEffect(() => {
    const h = () => flush();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [flush]);

  const current = (): ScrapDocument => ({
    ...doc,
    title,
    content: (editor?.getJSON() ?? doc.content) as ScrapDocument["content"],
  });

  const share = async () => {
    try {
      const token = await getOrCreateShareLink(doc.id);
      const url = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("View-only link copied", { description: url });
    } catch {
      toast.error("Couldn't create a link.");
    }
  };

  const moveToTrash = async () => {
    if (settings.confirm_trash && !window.confirm("Move this to Trash?")) return;
    clearTimeout(timer.current);
    pending.current = {};
    try {
      await trashDocument(doc.id);
      toast.success("Moved to Trash");
      void navigate({ to: "/" });
    } catch {
      toast.error("Couldn't move that to Trash.");
    }
  };

  const menu = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Share and export" className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft">
            <Download className="h-[18px] w-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Sharing</DropdownMenuLabel>
          <DropdownMenuItem onClick={share}><Link2 className="mr-2 h-4 w-4" />Copy view-only link</DropdownMenuItem>
          <DropdownMenuItem onClick={() => revokeShareLinks(doc.id).then(() => toast.success("Links turned off"))}>
            <X className="mr-2 h-4 w-4" />Turn off shared links
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Files</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => exportMarkdown(current())}>Markdown (.md)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportMnml(current())}>Minimal Notes (.mnml)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void exportDocx(current())}>Word (.docx)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => canvasRef.current && void exportPng(current(), canvasRef.current)}>Image (.png)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => canvasRef.current && void exportPdf(current(), canvasRef.current)}>PDF (.pdf)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => editor && printDocument(title, editor.getHTML())}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        aria-label="Move to Trash"
        title="Move to Trash"
        onClick={() => void moveToTrash()}
        className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft"
      >
        <Trash2 className="h-[18px] w-[18px]" />
      </button>
    </>
  );

  const widthClass =
    CANVAS_WIDTHS.find((w) => w.key === settings.canvas_width)?.className ?? "max-w-3xl";

  return (
    <div className={cn("min-h-screen", split && "split-layout")}>
      <div className="no-print"><TopBar kind={kind} onAskGemini={() => setAskOpen((o) => !o)} left={menu} tools={<><Button variant="ghost" size="icon" aria-label="Dictate" title="Dictate" onClick={() => window.dispatchEvent(new Event("scrap:voice"))}><Mic /></Button><Button variant="ghost" size="icon" aria-label="Split view" title="Split view" aria-pressed={split} onClick={() => setSplit(value => !value)}><Columns2 /></Button></>} /></div>
      {editor && <div className="no-print"><Toolbar editor={editor} kind={kind} /></div>}
      <main
        className={cn(
          "primary-document px-4 pt-24 sm:px-10", settings.typeliner ? "pb-[50vh]" : "pb-32",
          settings.toolbar_side === "left" ? "pl-16 sm:pl-24" : "pr-16 sm:pr-24",
        )}
      >
        <div ref={canvasRef} data-doc-font={settings.font} className={cn("canvas-surface relative mx-auto min-h-[70vh] rounded-3xl px-6 py-10 sm:px-12", widthClass)}>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              queue({ title: e.target.value });
            }}
            placeholder="Untitled"
            className="mb-6 w-full bg-transparent font-[family-name:var(--font-doc)] text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
          />
          <div className="scrap-editor" spellCheck={settings.spellcheck}>
            <EditorContent editor={editor} />
          </div>
          {settings.show_cursors &&
            peers.map((p) => {
              const c = caretFor(p);
              if (!c) return null;
              return (
                <div key={p.id} className="collab-caret no-print" style={{ top: c.top, left: c.left, height: c.height, background: p.color }}>
                  {settings.show_names && <span style={{ background: p.color }}>{p.name}</span>}
                </div>
              );
            })}
          {ghost && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="opacity-60">{ghost}</span>
              <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[11px]">Tab</span>
            </p>
          )}
        </div>
      </main>
      {split && <SplitPane primaryId={doc.id} onClose={() => setSplit(false)} />}

      {settings.show_word_count && (
        <p className="no-print fixed bottom-4 left-1/2 z-20 -translate-x-1/2 text-[11px] tracking-wide text-muted-foreground">
          {counts.words} words · {counts.chars} characters
        </p>
      )}

      {editor && slash && (
        <SlashMenu
          editor={editor}
          kind={kind}
          state={slash}
          keyRef={slashKeyRef}
          onClose={() => setSlash(null)}
          onAsk={() => { setSlash(null); setAskOpen(true); }}
          startTask={startTask}
        />
      )}

      {tasks.length > 0 && (
        <div className="no-print fixed top-16 right-4 z-40 flex flex-row-reverse items-start gap-2">
          {tasks.map((t) => {
            const Icon = TASK_ICONS[t.kind];
            const expanded = openTask === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={t.label}
                onClick={() => setOpenTask(expanded ? null : t.id)}
                className={cn(
                  "relative flex h-9 items-center gap-2 overflow-hidden rounded-full border border-border bg-card text-brand shadow-lift transition-all duration-300",
                  expanded ? "px-3.5" : "w-9 justify-center",
                  t.done ? "animate-bubble-pop" : "animate-pill-in",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 animate-pulse" />
                {expanded && <span className="text-[12px] whitespace-nowrap text-foreground">{t.label}</span>}
              </button>
            );
          })}
        </div>
      )}

      {askOpen && (
        <AskPill
          kind={kind}
          onClose={() => setAskOpen(false)}
          getBody={() => ({ documentTitle: title, documentText: editor?.getText() ?? "" })}
          onTool={(name, input) => (editor ? applyDocTool(editor, name, input) : "no editor")}
        />
      )}
    </div>
  );
}

type Peer = { id: string; name: string; color: string; pos: number };

const TASK_ICONS: Record<TaskKind, typeof Sparkles> = {
  ai: Sparkles,
  aitable: Table,
  chart: BarChart3,
  aiimage: Wand2,
};
