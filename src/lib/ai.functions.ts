import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CompleteInput = z.object({
  before: z.string().max(4000),
  kind: z.enum(["note", "page"]),
});

/**
 * Short inline continuation used for the ghost-text autocomplete in the editor.
 */
export const completeText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CompleteInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { suggestion: "" };

    const trimmed = data.before.trimEnd();
    if (trimmed.length < 12) return { suggestion: "" };

    const { createLovableAiGatewayProvider, GEMINI_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    try {
      const { text } = await generateText({
        model: createLovableAiGatewayProvider(key)(GEMINI_MODEL),
        system:
          "You continue the user's writing inline. Reply with ONLY the next few words " +
          "(at most 12 words) that naturally continue the text, correcting obvious typos in " +
          "the flow. No quotes, no explanation, no repeating what was written. If no sensible " +
          "continuation exists, reply with an empty string.",
        prompt:
          (data.kind === "note" ? "A short note.\n\n" : "A long-form document.\n\n") +
          "Continue this text:\n\n" +
          data.before.slice(-1500),
      });
      const suggestion = text.replace(/^["'\s]+|["']+$/g, "").slice(0, 120);
      return { suggestion: suggestion.includes("\n") ? suggestion.split("\n")[0]! : suggestion };
    } catch (error) {
      console.error("autocomplete error", error);
      return { suggestion: "" };
    }
  });
