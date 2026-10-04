import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, GEMINI_MODEL } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: unknown;
  documentTitle?: string;
  documentText?: string;
};

const STYLE = `Be brutally direct. Give the shortest complete answer — no greetings, no preamble,
no restating the question, no closing offers. If asked how to spell a word, reply with just the word.
If one word answers it, reply with one word. Use Markdown (lists, tables) only when it truly helps.`;

const RESEARCH_PROMPT = `You are the research assistant inside Scrap, a minimal writing app. ${STYLE}
You can produce tables in Markdown. Say plainly when you are unsure.`;

const DOCUMENT_PROMPT = `You are the writing assistant inside Scrap, a minimal writing app. ${STYLE}
You can see the open document below and you can EDIT it directly with tools:
- insert_text: add new Markdown content at the cursor or end (writing, continuing, adding a table, list, section).
- replace_text: swap an exact passage for new text (fix typos, reword a sentence).
- replace_document: rewrite the entire document (only when asked to rewrite/restructure everything).
When the user asks you to write, add, fix, edit, rewrite, translate, format or continue the document, USE A TOOL
instead of pasting the text in chat, then reply with a 2-5 word confirmation like "Added." or "Fixed 3 typos.".
For questions about the document, just answer. Match the document's tone and language.`;

const docTools = {
  insert_text: tool({
    description: "Insert Markdown content into the document.",
    inputSchema: z.object({
      markdown: z.string().describe("Content in Markdown (headings, lists, tables, bold/italic supported)"),
      position: z.enum(["cursor", "end", "start"]).describe("Where to insert"),
    }),
  }),
  replace_text: tool({
    description: "Replace an exact passage of the document with new plain text.",
    inputSchema: z.object({
      find: z.string().describe("Exact text currently in the document"),
      replace: z.string().describe("Replacement text"),
    }),
  }),
  replace_document: tool({
    description: "Replace the whole document body with new Markdown.",
    inputSchema: z.object({ markdown: z.string() }),
  }),
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env['LOVABLE_API_KEY'];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const hasDoc = typeof body.documentText === "string";
        const system = hasDoc
          ? `${DOCUMENT_PROMPT}\n\n--- DOCUMENT: ${body.documentTitle || "Untitled"} ---\n${(
              body.documentText ?? ""
            ).slice(0, 24000)}\n--- END DOCUMENT ---`
          : RESEARCH_PROMPT;

        const gateway = createLovableAiGatewayProvider(key);

        try {
          const result = streamText({
            model: gateway(GEMINI_MODEL),
            system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            abortSignal: request.signal,
            ...(hasDoc ? { tools: docTools, stopWhen: stepCountIs(1) } : {}),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (error) {
          console.error("chat error", error);
          return new Response("The assistant could not respond right now.", { status: 502 });
        }
      },
    },
  },
});
