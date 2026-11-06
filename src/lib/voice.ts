import { supabase } from "@/integrations/supabase/client";

export type Recorder = { stop: () => Promise<string>; cancel: () => void };

/** Start recording from the mic. stop() uploads and resolves with cleaned-up text. */
export async function startDictation(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  const end = () => stream.getTracks().forEach((t) => t.stop());

  return {
    cancel: () => { rec.stop(); end(); },
    stop: async () => {
      rec.stop();
      await done;
      end();
      const mime = rec.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mime.split(";")[0] ?? "audio/webm" });
      if (blob.size < 1000) return "";
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("file", new File([blob], `speech.${ext}`, { type: blob.type }));
      form.append("clean", "1");
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: form,
      });
      if (!res.ok) throw new Error((await res.text()) || "Couldn't transcribe that.");
      return ((await res.json()) as { text: string }).text;
    },
  };
}
