import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type UserSettings } from "./scrap-types";
import { setFolderView, useFolderView } from "./folder-view";

const STORAGE_KEY = "scrap.settings";

type SettingsContextValue = {
  settings: UserSettings;
  update: (patch: Partial<UserSettings>) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

function readLocal(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const v = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
    if (!["default", "cursive", "switzer", "google-sans", "literata"].includes(v.font)) v.font = "default";
    return v;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyToDom(settings: UserSettings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dataset['accent'] = settings.accent_theme;
  el.dataset['docFont'] = settings.font;
  el.classList.toggle("dark", settings.color_mode === "dark");
  el.style.colorScheme = settings.color_mode;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // hydrate from local storage on mount (avoids SSR mismatch)
  useEffect(() => {
    const local = readLocal();
    setSettings(local);
    applyToDom(local);
  }, []);

  // pull the saved settings for the signed-in account
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("user_settings")
        .select(
          "font, accent_theme, color_mode, toolbar_side, canvas_width, show_ask_gemini, ghost_autocomplete, show_word_count, card_previews, typeliner, spellcheck, slash_commands, confirm_trash, pages_only, username, collab_color, show_cursors, show_names, show_whats_new",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!active || !data) return;
      const next = { ...DEFAULT_SETTINGS, ...(data as Partial<UserSettings>), folder_view: readLocal().folder_view };
      if (!["default", "cursive", "switzer", "google-sans", "literata"].includes(next.font)) next.font = "default";
      setSettings(next);
      applyToDom(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void load();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const update = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applyToDom(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      void (async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        const { folder_view: _folderView, ...cloudSettings } = next;
        await supabase
          .from("user_settings")
          .upsert({ user_id: auth.user.id, ...cloudSettings }, { onConflict: "user_id" });
      })();
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  const folderView = useFolderView();
  const update = useCallback((patch: Partial<UserSettings>) => {
    if (patch.folder_view) setFolderView(patch.folder_view);
    const { folder_view: _folderView, ...remaining } = patch;
    if (Object.keys(remaining).length) context.update(remaining);
  }, [context.update]);
  return { settings: { ...context.settings, folder_view: folderView }, update };
}
