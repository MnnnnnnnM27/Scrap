import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const speakToGemini = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) })).min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { text: "", error: "AI is not configured." };
    const { createLovableAiGatewayProvider, GEMINI_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    try {
      const { text } = await generateText({ model: createLovableAiGatewayProvider(key)(GEMINI_MODEL), system: "You are Scrap's spoken Gemini assistant. Answer directly and concisely, in plain text suitable for speech. No greetings or preamble. Use the conversation context; do not claim to edit documents or perform actions.", messages: data.messages });
      return { text, error: "" };
    } catch { return { text: "", error: "Gemini couldn't respond. Try again." }; }
  });