import { useEffect, useState } from "react";

export type ShortcutAction = "newNote" | "newPage" | "search" | "split" | "voice" | "home" | "research";

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  newNote: "New note",
  newPage: "New page",
  search: "Search",
  split: "Split view",
  voice: "Dictate",
  home: "Go home",
  research: "Research",
};

export type Shortcuts = Record<ShortcutAction, string> & { slashTrigger: string };

export const DEFAULT_SHORTCUTS: Shortcuts = {
  newNote: "Alt+N",
  newPage: "Alt+P",
  search: "Mod+K",
  split: "Mod+\\",
  voice: "Alt+D",
  home: "Alt+H",
  research: "Alt+R",
  slashTrigger: "/",
};

const KEY = "scrap.shortcuts";
const EVT = "scrap:shortcuts";

export function readShortcuts(): Shortcuts {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    return { ...DEFAULT_SHORTCUTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Shortcuts>) };
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(next: Shortcuts) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVT));
}

export function useShortcuts(): Shortcuts {
  const [s, setS] = useState<Shortcuts>(DEFAULT_SHORTCUTS);
  useEffect(() => {
    setS(readShortcuts());
    const h = () => setS(readShortcuts());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return s;
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Turn a key event into a combo string like "Mod+Shift+K". Returns null for bare modifier presses. */
export function comboFromEvent(e: KeyboardEvent): string | null {
  if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return null;
  const parts: string[] = [];
  if (isMac() ? e.metaKey : e.ctrlKey) parts.push("Mod");
  if (isMac() && e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  // e.code keeps letters stable when Alt changes the produced character on macOS
  let k = e.code.startsWith("Key") ? e.code.slice(3) : e.code.startsWith("Digit") ? e.code.slice(5) : e.key;
  if (e.code === "Backslash") k = "\\";
  if (e.code === "Slash") k = "/";
  if (k === " ") k = "Space";
  parts.push(k.length === 1 ? k.toUpperCase() : k);
  return parts.join("+");
}

export function prettyCombo(c: string): string {
  if (!c) return "—";
  const mac = isMac();
  return c
    .split("+")
    .map((p) =>
      p === "Mod" ? (mac ? "⌘" : "Ctrl") : p === "Alt" ? (mac ? "⌥" : "Alt") : p === "Shift" ? (mac ? "⇧" : "Shift") : p === "Ctrl" ? "⌃" : p,
    )
    .join(mac ? "" : "+");
}
