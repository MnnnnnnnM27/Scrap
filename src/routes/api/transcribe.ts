import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createLovableAiGatewayProvider, GEMINI_MODEL } from "@/lib/ai-gateway.server";

const MAX_BYTES = 20 * 1024 * 1024;

const CLEAN = `Clean up this dictated text. Remove filler words (um, uh, like, you know, so basically),
false starts and repeats. Fix punctuation, capitalization and paragraph breaks. Keep the speaker's words,
meaning and language. Do not add anything. Return only the cleaned text, in Markdown if lists clearly fit.`;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // only signed-in Scrap users may transcribe
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Sign in to dictate", { status: 401 });
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false },
        });
        const { data: auth } = await sb.auth.getUser(token);
        if (!auth.user) return new Response("Sign in to dictate", { status: 401 });

        const len = Number(request.headers.get("content-length") || 0);
        if (len > MAX_BYTES) return new Response("Recording is too long", { status: 413 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES)
          return new Response("No audio received", { status: 400 });

        const up = new FormData();
        up.append("model", "openai/gpt-transcribe");
        up.append("file", file, file.name || "speech.webm");
        up.append("response_format", "json");
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: up,
          signal: request.signal,
        });
        if (!res.ok) {
          const msg = res.status === 402 ? "AI credits are used up." : res.status === 429 ? "Too many requests — try again in a moment." : "Couldn't transcribe that.";
          return new Response(msg, { status: res.status });
        }
        const raw = ((await res.json()) as { text?: string }).text?.trim() ?? "";
        if (!raw) return Response.json({ text: "" });
        if (form.get("clean") !== "1") return Response.json({ text: raw });
        try {
          const { text } = await generateText({
            model: createLovableAiGatewayProvider(key)(GEMINI_MODEL),
            system: CLEAN,
            prompt: raw,
            abortSignal: request.signal,
          });
          return Response.json({ text: text.trim() || raw });
        } catch {
          return Response.json({ text: raw });
        }
      },
    },
  },
});
