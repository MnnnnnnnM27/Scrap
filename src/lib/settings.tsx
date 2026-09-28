import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type UserSettings } from "./scrap-types";

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
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
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
          "font, accent_theme, color_mode, toolbar_side, canvas_width, show_ask_gemini, ghost_autocomplete, show_word_count, card_previews",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!active || !data) return;
      const next = { ...DEFAULT_SETTINGS, ...(data as Partial<UserSettings>) };
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
        await supabase
          .from("user_settings")
          .upsert({ user_id: auth.user.id, ...next }, { onConflict: "user_id" });
      })();
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
