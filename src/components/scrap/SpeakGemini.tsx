import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Loader2, Mic, Square, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { startDictation, type Recorder } from "@/lib/voice";
import { speakToGemini } from "@/lib/speak.functions";

export function SpeakGemini({ onClose }: { onClose: () => void }) {
  const ask = useServerFn(speakToGemini);
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const recorder = useRef<Recorder | null>(null);
  const alive = useRef(true);
  const messagesRef = useRef(messages); messagesRef.current = messages;
  useEffect(() => { alive.current = true; return () => { alive.current = false; recorder.current?.cancel(); window.speechSynthesis?.cancel(); }; }, []);
  const send = async (text: string) => {
    if (!text.trim()) { setState("idle"); return; }
    const history = [...messagesRef.current, { role: "user" as const, content: text }].slice(-19);
    setMessages(history); setInput(""); setState("thinking"); setError("");
    try {
      const result = await ask({ data: { messages: history } });
      if (!alive.current) return;
      if (result.error) throw new Error(result.error);
      setMessages([...history, { role: "assistant", content: result.text }]);
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(result.text);
        utterance.onend = () => { if (alive.current) setState("idle"); };
        utterance.onerror = () => { if (alive.current) setState("idle"); };
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); setState("speaking");
      } else setState("idle");
    } catch (e) { if (alive.current) { setError(e instanceof Error ? e.message : "Couldn't respond."); setState("idle"); } }
  };
  const toggle = async () => {
    if (state === "thinking") return;
    if (state === "speaking") { window.speechSynthesis?.cancel(); setState("idle"); return; }
    if (recorder.current) {
      const rec = recorder.current; recorder.current = null; setState("thinking");
      try { const text = await rec.stop(); if (alive.current) await send(text); } catch { if (alive.current) { setError("Couldn't transcribe. Try again."); setState("idle"); } }
    } else {
      try { const rec = await startDictation(); if (!alive.current) { rec.cancel(); return; } recorder.current = rec; setState("listening"); setError(""); }
      catch { setError("Microphone access is unavailable. You can type below."); setState("idle"); }
    }
  };
  const toggleRef = useRef(toggle); toggleRef.current = toggle;
  useEffect(() => { void toggleRef.current(); const h = () => void toggleRef.current(); window.addEventListener("scrap:speak-toggle", h); return () => window.removeEventListener("scrap:speak-toggle", h); }, []);
  return <Dialog open onOpenChange={v => { if (!v) onClose(); }}><DialogContent aria-describedby={undefined} className="glass w-[calc(100%-2rem)] max-w-lg rounded-lg"><DialogTitle>Speak to Gemini</DialogTitle>
    <div className="voice-wave flex h-14 items-center justify-center gap-1" data-active={state !== "idle"} aria-label={state}>{Array.from({ length: 9 }, (_, i) => <span key={i} className={`voice-bar voice-bar-${i % 3}`} />)}</div>
    <p className="text-center text-sm text-muted-foreground">{state === "listening" ? "Listening…" : state === "thinking" ? "Thinking…" : state === "speaking" ? "Speaking…" : "Gemini"}</p>
    <div className="max-h-64 space-y-4 overflow-y-auto" aria-live="polite">{messages.map((m, i) => <p key={i} className={m.role === "user" ? "text-sm text-muted-foreground" : "text-base leading-relaxed"}>{m.content}</p>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); void send(input); }}><input aria-label="Message Gemini" placeholder="Ask Gemini…" value={input} onChange={e => setInput(e.target.value)} className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm" /><Button type="submit" size="icon" aria-label="Send to Gemini" disabled={state !== "idle" || !input.trim()}><ArrowUp /></Button></form>
    <div className="flex justify-center gap-2"><Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" aria-label={state === "listening" ? "Stop and send to Gemini" : state === "speaking" ? "Stop speaking" : "Start speaking to Gemini"} onClick={() => void toggle()} disabled={state === "thinking"}>{state === "thinking" ? <Loader2 className="animate-spin" /> : state === "listening" ? <Square /> : state === "speaking" ? <Volume2 /> : <Mic />}</Button><Button variant="ghost" size="icon" aria-label="Close voice conversation" onClick={onClose}><X /></Button></div>
  </DialogContent></Dialog>;
}