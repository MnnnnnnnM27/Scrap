import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { FileUp, Loader2, Mic, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { activeEditor } from "@/lib/active-editor";
import { createDocument, pendingOfflineSaves, syncOfflineSaves } from "@/lib/documents";
import { htmlToDoc, isImportable, readFile } from "@/lib/file-import";
import { markdownToHtml } from "@/lib/markdown-html";
import { useSettings } from "@/lib/settings";
import { comboFromEvent, readShortcuts } from "@/lib/shortcuts";
import { startDictation, type Recorder } from "@/lib/voice";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { setOfflineAccount } from "@/lib/offline-store";

/** App-wide: file drop overlay, keyboard shortcuts, dictation and offline sync. */
export function GlobalLayer() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useSettings();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const depth = useRef(0);
  const [voice, setVoice] = useState<"idle" | "rec" | "work">("idle");
  const rec = useRef<Recorder | null>(null);
  const [online, setOnline] = useState(true);
  const { user } = useAuth();
  useEffect(() => { setOfflineAccount(user?.id ?? null); }, [user?.id]);

  const signedInArea = !!user && !["/auth", "/s/", "/join/", "/.lovable"].some((p) => path.startsWith(p));

  // ---- file drop ----
  useEffect(() => {
    if (!user) return;
    if (!signedInArea) return;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth.current++; setDragging(true); };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = () => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); };
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      const file = [...(e.dataTransfer?.files ?? [])][0];
      depth.current = 0;
      setDragging(false);
      if (!file) return;
      // images inside an editor are handled by the editor itself
      if (file.type.startsWith("image/") && e.target instanceof Element && e.target.closest(".ProseMirror")) return;
      e.preventDefault();
      e.stopPropagation();
      if (!isImportable(file)) return void toast.error("Scrap opens .docx, .pdf, .md and .txt files.");
      setBusy(true);
      try {
        const imp = await readFile(file);
        {
          const kind = "page";
          const content = htmlToDoc(imp.html, kind);
          const tmp = document.createElement("div");
          tmp.innerHTML = imp.html;
          const doc = await createDocument(kind, { title: imp.title, content, plain_text: tmp.innerText.slice(0, 200000) });
          void qc.invalidateQueries({ queryKey: ["documents"] });
          void navigate({ to: "/page/$id", params: { id: doc.id } });
        }
      } catch (err) {
        console.error(err);
        toast.error("Couldn't open that file.");
      } finally {
        setBusy(false);
      }
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop, true);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop, true);
    };
  }, [signedInArea, user, path, navigate, qc]);

  // ---- dictation ----
  const toggleVoice = async () => {
    if (voice === "work") return;
    if (voice === "rec") {
      const r = rec.current;
      if (!r) return;
      const target = activeEditor.current;
      rec.current = null;
      setVoice("work");
      try {
        const text = await r.stop();
        if (!text) toast("Didn't catch anything.");
        else if (target && !target.isDestroyed) target.chain().focus().insertContent(markdownToHtml(text)).run();
        else {
          await navigator.clipboard.writeText(text).catch(() => {});
          toast.success("Copied what you said", { description: text.slice(0, 140) });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't transcribe that.");
      }
      setVoice("idle");
      return;
    }
    try {
      if (!navigator.onLine) return void toast.error("Connect to the internet to dictate.");
      rec.current = await startDictation();
      setVoice("rec");
    } catch {
      toast.error("Microphone access was blocked.");
    }
  };
  const toggleRef = useRef(toggleVoice);
  toggleRef.current = toggleVoice;
  useEffect(() => {
    if (!signedInArea) return;
    const h = () => void toggleRef.current();
    window.addEventListener("scrap:voice", h);
    return () => window.removeEventListener("scrap:voice", h);
  }, [signedInArea]);
  useEffect(() => () => { rec.current?.cancel(); rec.current = null; }, [user?.id]);

  // ---- shortcuts ----
  useEffect(() => {
    if (!signedInArea) return;
    const h = async (e: KeyboardEvent) => {
      const combo = comboFromEvent(e);
      if (e.defaultPrevented || e.isComposing || e.repeat) return;
      if (!combo) return;
      const s = readShortcuts();
      const action = (Object.keys(s) as (keyof typeof s)[]).find((k) => k !== "slashTrigger" && s[k] === combo);
      if (!action) return;
      e.preventDefault();
      if (action === "newNote" || action === "newPage") {
        const kind = action === "newNote" && !settings.pages_only ? "note" : "page";
        try {
          const d = await createDocument(kind);
          void qc.invalidateQueries({ queryKey: ["documents"] });
          void navigate({ to: kind === "note" ? "/note/$id" : "/page/$id", params: { id: d.id } });
        } catch { toast.error("Couldn't create that."); }
      } else if (action === "search") {
        const input = document.querySelector<HTMLInputElement>('input[type="search"]');
        if (input) input.focus();
        else { await navigate({ to: "/" }); setTimeout(() => document.querySelector<HTMLInputElement>('input[type="search"]')?.focus(), 150); }
      } else if (action === "home") void navigate({ to: "/" });
      else if (action === "research") void navigate({ to: "/research" });
      else if (action === "split") {
        if (/^\/(?:note|page)\//.test(path)) window.dispatchEvent(new Event("scrap:split"));
        else toast("Open a document to use split view.");
      }
      else if (action === "voice") void toggleRef.current();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [signedInArea, settings.pages_only, path, navigate, qc]);

  // ---- offline sync ----
  useEffect(() => {
    const sync = async () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine || !pendingOfflineSaves()) return;
      const n = await syncOfflineSaves().catch(() => 0);
      if (n) { toast.success("Back online — changes synced"); void qc.invalidateQueries(); }
    };
    void sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, [qc, user]);

  if (!signedInArea) return null;
  return (
    <>
      {(dragging || busy) && (
        <div className="no-print pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass flex flex-col items-center gap-3 rounded-3xl px-10 py-8 text-center">
            {busy ? <Loader2 className="h-7 w-7 animate-spin text-brand" /> : <FileUp className="h-7 w-7 text-brand" />}
            <p className="text-[15px] font-medium">{busy ? "Opening…" : "Drop to open a new Page"}</p>
            <p className="text-xs text-muted-foreground">.docx · .pdf · .md · .txt</p>
          </div>
        </div>
      )}
      {voice !== "idle" && (
        <div className="no-print glass animate-pill-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4">
          {voice === "rec" ? <Mic className="h-4 w-4 animate-pulse text-destructive" /> : <Loader2 className="h-4 w-4 animate-spin text-brand" />}
          <span className="text-[13px]">{voice === "rec" ? "Listening…" : "Cleaning up…"}</span>
          {voice === "rec" && (
            <>
              <Button type="button" size="icon" aria-label="Stop and insert" onClick={() => void toggleVoice()} className="h-8 w-8 rounded-full bg-brand text-brand-foreground">
                <Square className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Cancel" onClick={() => { rec.current?.cancel(); rec.current = null; setVoice("idle"); }} className="h-8 w-8 rounded-full text-muted-foreground">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}
      {!online && (
        <div className={cn("no-print glass fixed bottom-6 right-6 z-40 rounded-full px-3.5 py-1.5 text-[12px] text-muted-foreground")}>
          Offline — saving on this device
        </div>
      )}
    </>
  );
}
