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

function aiError(e: unknown) {
  const m = String((e as Error)?.message ?? e).toLowerCase();
  if (m.includes("402") || m.includes("credit")) return "AI credits are used up. Top up in Lovable to keep using Gemini.";
  if (m.includes("429") || m.includes("rate")) return "Gemini is busy — try again in a few seconds.";
  return "Gemini couldn't do that right now. Try again.";
}

const PromptInput = z.object({ prompt: z.string().min(1).max(2000), context: z.string().max(6000).optional() });

/** Markdown table generated from a plain-language request. */
export const generateTable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PromptInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { markdown: "", error: "AI is not configured." };
    const { createLovableAiGatewayProvider, GEMINI_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    try {
      const { text } = await generateText({
        model: createLovableAiGatewayProvider(key)(GEMINI_MODEL),
        system:
          "Output ONLY a single GitHub-flavoured Markdown table that fulfils the request. " +
          "A header row, then data rows. No title, no code fences, no notes. Keep cells short. Max 12 rows, 6 columns.",
        prompt: (data.context ? `Document context:\n${data.context}\n\n` : "") + `Request: ${data.prompt}`,
      });
      const md = text.replace(/```[a-z]*\n?|```/g, "").trim();
      return { markdown: md, error: md.includes("|") ? undefined : "Couldn't build a table from that." };
    } catch (e) {
      console.error("table error", e);
      return { markdown: "", error: aiError(e) };
    }
  });

/** Chart spec (rendered client-side to a PNG). */
export const generateChart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PromptInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { error: "AI is not configured." };
    const { createLovableAiGatewayProvider, GEMINI_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    try {
      const { text } = await generateText({
        model: createLovableAiGatewayProvider(key)(GEMINI_MODEL),
        system:
          'Output ONLY minified JSON: {"title":string,"type":"bar"|"line"|"pie","labels":string[],"values":number[]}. ' +
          "Pick the best chart type unless the user names one. Max 12 points. Use real, accurate figures when the request is factual; otherwise sensible example data.",
        prompt: (data.context ? `Document context:\n${data.context}\n\n` : "") + `Request: ${data.prompt}`,
      });
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const spec = z
        .object({
          title: z.string(),
          type: z.enum(["bar", "line", "pie"]),
          labels: z.array(z.string()),
          values: z.array(z.number()),
        })
        .parse(JSON.parse(json));
      return { spec };
    } catch (e) {
      console.error("chart error", e);
      return { error: aiError(e) };
    }
  });

/** AI image, returned as a base64 PNG data URL. */
export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PromptInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { error: "AI is not configured." };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({ model: "openai/gpt-image-2.5-sunburst", prompt: data.prompt, size: "1024x1024", quality: "low" }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("image error", res.status, body.slice(0, 300));
        return { error: aiError(`${res.status}`) };
      }
      const json = (await res.json()) as { data?: { b64_json?: string }[] };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) return { error: "No image came back. Try a different description." };
      return { dataUrl: `data:image/png;base64,${b64}` };
    } catch (e) {
      console.error("image error", e);
      return { error: aiError(e) };
    }
  });
