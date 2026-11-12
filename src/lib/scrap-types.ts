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
  collab_token?: string | null;
  book?: BookMetadata | null;
  editing_seconds?: number;
};

export type BookMetadata = { author: string; subtitle: string; front_cover: string; back_cover: string; blurb: string; word_target: number };
export const EMPTY_BOOK: BookMetadata = { author: "", subtitle: "", front_cover: "", back_cover: "", blurb: "", word_target: 10000 };

export type FolderColor = "graphite" | "marine" | "emerald" | "amber" | "coral" | "plum";
export type ScrapFolder = { id: string; user_id: string; name: string; color: FolderColor; position: number; created_at: string };
export const FOLDER_COLORS: FolderColor[] = ["graphite", "marine", "emerald", "amber", "coral", "plum"];

export type AccentTheme = "dark-grey" | "blue" | "green" | "amber" | "rose" | "violet" | "teal" | "terracotta" | "sage";
export type ColorMode = "light" | "dark";
export type DocFont = "default" | "cursive" | "switzer" | "google-sans" | "literata";
export type ToolbarSide = "left" | "right";
export type CanvasWidth = "narrow" | "standard" | "wide";
export type FolderView = "sidebar" | "compact";
export type SurfaceMode = "glass" | "flat";
export type HomeStyle = "v4.2" | "v4.3";

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
  typeliner: boolean;
  spellcheck: boolean;
  slash_commands: boolean;
  confirm_trash: boolean;
  pages_only: boolean;
  folder_view: FolderView;
  surface_mode: SurfaceMode;
  home_style: HomeStyle;
  username: string;
  collab_color: string;
  show_cursors: boolean;
  show_names: boolean;
  show_whats_new: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  font: "default",
  accent_theme: "dark-grey",
  color_mode: "light",
  toolbar_side: "right",
  canvas_width: "standard",
  show_ask_gemini: true,
  ghost_autocomplete: true,
  show_word_count: true,
  card_previews: false,
  typeliner: false,
  spellcheck: true,
  slash_commands: true,
  confirm_trash: false,
  pages_only: false,
  folder_view: "compact",
  surface_mode: "glass",
  home_style: "v4.3",
  username: "",
  collab_color: "#3b82f6",
  show_cursors: true,
  show_names: true,
  show_whats_new: true,
};

export const ACCENT_THEMES: { key: AccentTheme; label: string }[] = [
  { key: "dark-grey", label: "Dark Grey" },
  { key: "blue", label: "Blue" },
  { key: "teal", label: "Teal" },
  { key: "green", label: "Green" },
  { key: "sage", label: "Sage" },
  { key: "amber", label: "Amber" },
  { key: "terracotta", label: "Terracotta" },
  { key: "rose", label: "Rose" },
  { key: "violet", label: "Violet" },
];

export const CANVAS_WIDTHS: { key: CanvasWidth; label: string; className: string }[] = [
  { key: "narrow", label: "Narrow", className: "max-w-xl" },
  { key: "standard", label: "Standard", className: "max-w-3xl" },
  { key: "wide", label: "Wide", className: "max-w-5xl" },
];

export const DOC_FONTS: { key: DocFont; label: string; sample: string }[] = [
  { key: "default", label: "Default", sample: "-apple-system, system-ui, sans-serif" },
  { key: "switzer", label: "Outfit", sample: "Outfit, sans-serif" },
  { key: "google-sans", label: "Google Sans", sample: "'Google Sans', sans-serif" },
  { key: "literata", label: "Literata", sample: "Literata, serif" },
  { key: "cursive", label: "Cursive", sample: "Caveat, cursive" },
];

export const PAGE_FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Outfit", value: "Outfit, sans-serif" },
  { label: "Google Sans", value: "'Google Sans', sans-serif" },
  { label: "Literata", value: "Literata, serif" },
  { label: "Cursive", value: "Caveat, cursive" },
];
