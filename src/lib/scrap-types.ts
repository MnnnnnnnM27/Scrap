export type DocKind = "note" | "page";

export type ScrapDocument = {
  id: string;
  user_id: string;
  kind: DocKind;
  title: string;
  content: unknown;
  plain_text: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  folder_id?: string | null;
};

export type FolderColor = "graphite" | "marine" | "emerald" | "amber" | "coral" | "plum";
export type ScrapFolder = { id: string; user_id: string; name: string; color: FolderColor; position: number; created_at: string };
export const FOLDER_COLORS: FolderColor[] = ["graphite", "marine", "emerald", "amber", "coral", "plum"];

export type AccentTheme = "dark-grey" | "blue" | "green" | "amber" | "rose" | "violet";
export type ColorMode = "light" | "dark";
export type DocFont = "default" | "instrument" | "literata" | "newsreader" | "mono";
export type ToolbarSide = "left" | "right";
export type CanvasWidth = "narrow" | "standard" | "wide";

export type UserSettings = {
  font: DocFont;
  accent_theme: AccentTheme;
  color_mode: ColorMode;
  toolbar_side: ToolbarSide;
  canvas_width: CanvasWidth;
  show_ask_gemini: boolean;
  ghost_autocomplete: boolean;
  show_word_count: boolean;
  card_previews: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  font: "default",
  accent_theme: "dark-grey",
  color_mode: "light",
  toolbar_side: "right",
  canvas_width: "standard",
  show_ask_gemini: true,
  ghost_autocomplete: true,
  show_word_count: false,
  card_previews: false,
};

export const ACCENT_THEMES: { key: AccentTheme; label: string }[] = [
  { key: "dark-grey", label: "Dark Grey" },
  { key: "blue", label: "Blue" },
  { key: "green", label: "Green" },
  { key: "amber", label: "Amber" },
  { key: "rose", label: "Rose" },
  { key: "violet", label: "Violet" },
];

export const CANVAS_WIDTHS: { key: CanvasWidth; label: string; className: string }[] = [
  { key: "narrow", label: "Narrow", className: "max-w-xl" },
  { key: "standard", label: "Standard", className: "max-w-3xl" },
  { key: "wide", label: "Wide", className: "max-w-5xl" },
];

export const DOC_FONTS: { key: DocFont; label: string; sample: string }[] = [
  { key: "default", label: "Default", sample: "system-ui" },
  { key: "instrument", label: "Instrument Sans", sample: "'Instrument Sans', sans-serif" },
  { key: "literata", label: "Literata", sample: "Literata, serif" },
  { key: "newsreader", label: "Newsreader", sample: "Newsreader, serif" },
  { key: "mono", label: "JetBrains Mono", sample: "'JetBrains Mono', monospace" },
];

export const PAGE_FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Instrument Sans", value: "'Instrument Sans', sans-serif" },
  { label: "Literata", value: "Literata, serif" },
  { label: "Newsreader", value: "Newsreader, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
];
