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
};

export type AccentTheme = "dark-grey" | "blue" | "green" | "amber" | "rose" | "violet";
export type ColorMode = "light" | "dark";
export type DocFont = "default" | "instrument" | "literata" | "newsreader" | "mono";

export type UserSettings = {
  font: DocFont;
  accent_theme: AccentTheme;
  color_mode: ColorMode;
};

export const DEFAULT_SETTINGS: UserSettings = {
  font: "default",
  accent_theme: "dark-grey",
  color_mode: "light",
};

export const ACCENT_THEMES: { key: AccentTheme; label: string }[] = [
  { key: "dark-grey", label: "Dark Grey" },
  { key: "blue", label: "Blue" },
  { key: "green", label: "Green" },
  { key: "amber", label: "Amber" },
  { key: "rose", label: "Rose" },
  { key: "violet", label: "Violet" },
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
