import { Link } from "@tanstack/react-router";
import { Check, LogOut, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import {
  ACCENT_THEMES,
  DOC_FONTS,
  type AccentTheme,
  type ColorMode,
  type DocFont,
} from "@/lib/scrap-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ACCENT_SWATCH: Record<AccentTheme, string> = {
  "dark-grey": "oklch(0.36 0.008 265)",
  blue: "oklch(0.55 0.17 253)",
  green: "oklch(0.52 0.13 158)",
  amber: "oklch(0.63 0.15 62)",
  rose: "oklch(0.58 0.18 14)",
  violet: "oklch(0.54 0.18 295)",
};

export function SettingsBubble() {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen(true)}
        className="glass fixed top-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full text-brand transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[340px] overflow-y-auto sm:w-[380px]">
          <SheetHeader>
            <SheetTitle className="text-[17px] tracking-tight">Settings</SheetTitle>
          </SheetHeader>

          <div className="space-y-8 px-4 pb-10">
            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Appearance
              </h3>
              <div className="flex rounded-full bg-muted p-1">
                {(["light", "dark"] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update({ color_mode: mode })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium capitalize transition-colors",
                      settings.color_mode === mode
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {mode} mode
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Theme colour
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => update({ accent_theme: theme.key })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition-colors",
                      settings.accent_theme === theme.key
                        ? "border-brand bg-brand-soft"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full ring-1 ring-black/5"
                      style={{ background: ACCENT_SWATCH[theme.key] }}
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Themes adapt to the mode you're in, so they stay readable on light and dark
                backgrounds. The writing surface always stays neutral.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Writing font
              </h3>
              <div className="space-y-1.5">
                {DOC_FONTS.map((font) => (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => update({ font: font.key as DocFont })}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                      settings.font === font.key
                        ? "border-brand bg-brand-soft"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <span style={{ fontFamily: font.sample }} className="text-[15px]">
                      {font.label}
                    </span>
                    {settings.font === font.key && <Check className="h-4 w-4 text-brand" />}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2 border-t border-border pt-6">
              <Link
                to="/trash"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
                Trash
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Sign out
              </button>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
