import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, GEMINI_MODEL } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: unknown;
  documentTitle?: string;
  documentText?: string;
};

const RESEARCH_PROMPT = `You are the research assistant inside Scrap, a minimal writing app.
Answer research questions directly and accurately. Be concise and well organised:
short paragraphs, bullet points when listing. Say plainly when you are unsure.`;

const DOCUMENT_PROMPT = `You are the writing assistant inside Scrap, a minimal writing app.
You are scoped to the document below. Help the writer rewrite, summarise, continue writing,
and answer questions about it. Return only the requested text — no preamble, no meta commentary.
Match the document's existing tone and language.`;

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
