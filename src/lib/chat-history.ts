import type { UIMessage } from "ai";

export type SavedChat = { id: string; title: string; source: "research" | "doc"; updatedAt: number; messages: UIMessage[] };
const KEY = "scrap.chats";

export function listChats(): SavedChat[] {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedChat[]).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getChat(id: string) {
  return listChats().find((c) => c.id === id);
}

/** 2–4 word title from the first question. */
function titleFor(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ") ?? "";
  const words = text.replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter(Boolean);
  const stop = new Set(["the", "a", "an", "is", "are", "what", "how", "do", "does", "can", "you", "me", "i", "of", "to", "please", "my"]);
  const key = words.filter((w) => !stop.has(w.toLowerCase()));
  const pick = (key.length >= 2 ? key : words).slice(0, 4).join(" ");
  return pick ? pick[0]!.toUpperCase() + pick.slice(1) : "New chat";
}

export function saveChat(id: string, source: SavedChat["source"], messages: UIMessage[]) {
  if (!messages.length) return;
  const rest = listChats().filter((c) => c.id !== id);
  const prev = getChat(id);
  const chat: SavedChat = { id, source, messages, updatedAt: Date.now(), title: prev?.title ?? titleFor(messages) };
  try {
    localStorage.setItem(KEY, JSON.stringify([chat, ...rest].slice(0, 60)));
  } catch {
    /* storage full */
  }
}

export function deleteChat(id: string) {
  localStorage.setItem(KEY, JSON.stringify(listChats().filter((c) => c.id !== id)));
}
