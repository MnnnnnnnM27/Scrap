import { Link } from "@tanstack/react-router";
import { Check, LogOut, Moon, PanelLeft, PanelRight, Settings, Sun, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { useDashboardSettings, WIDGETS } from "@/lib/dashboard-settings";
import {
  ACCENT_THEMES,
  CANVAS_WIDTHS,
  DOC_FONTS,
  type AccentTheme,
  type ColorMode,
  type DocFont,
  type ToolbarSide,
  type UserSettings,
} from "@/lib/scrap-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const ACCENT_SWATCH: Record<AccentTheme, string> = {
  "dark-grey": "oklch(0.36 0.008 265)",
  blue: "oklch(0.55 0.17 253)",
  green: "oklch(0.52 0.13 158)",
  amber: "oklch(0.63 0.15 62)",
  rose: "oklch(0.58 0.18 14)",
  violet: "oklch(0.54 0.18 295)",
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[15px]">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsBubble() {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();
  const set = (patch: Partial<UserSettings>) => update(patch);
  const { dash, updateDash } = useDashboardSettings();

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
            <Group title="Appearance">
              <div className="flex rounded-full bg-muted p-1">
                {(["light", "dark"] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => set({ color_mode: mode })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium capitalize transition-colors",
                      settings.color_mode === mode
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {mode} mode
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Theme colour">
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => set({ accent_theme: theme.key })}
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
              <p className="text-xs text-muted-foreground">Adapts to light and dark.</p>
            </Group>

            <Group title="Writing font">
              <div className="space-y-1.5">
                {DOC_FONTS.map((font) => (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => set({ font: font.key as DocFont })}
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
            </Group>

            <Group title="Editor">
              <div className="flex rounded-full bg-muted p-1">
                {(["left", "right"] as ToolbarSide[]).map((sideOpt) => (
                  <button
                    key={sideOpt}
                    type="button"
                    onClick={() => set({ toolbar_side: sideOpt })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors",
                      settings.toolbar_side === sideOpt
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {sideOpt === "left" ? (
                      <PanelLeft className="h-4 w-4" />
                    ) : (
                      <PanelRight className="h-4 w-4" />
                    )}
                    Toolbar {sideOpt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CANVAS_WIDTHS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => set({ canvas_width: w.key })}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-xs transition-colors",
                      settings.canvas_width === w.key
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <Toggle label="Word count" hint="Quiet counter at the bottom." checked={settings.show_word_count} onChange={(v) => set({ show_word_count: v })} />
                <Toggle label="TypeLiner" hint="Keeps your line centered." checked={settings.typeliner} onChange={(v) => set({ typeliner: v })} />
                <Toggle label="/ commands" hint="Type / for tables, charts, more." checked={settings.slash_commands} onChange={(v) => set({ slash_commands: v })} />
                <Toggle label="Spellcheck" checked={settings.spellcheck} onChange={(v) => set({ spellcheck: v })} />
                <Toggle label="Confirm before Trash" checked={settings.confirm_trash} onChange={(v) => set({ confirm_trash: v })} />
              </div>
            </Group>

            <Group title="Home">
              <div className="overflow-hidden rounded-xl border border-border">
                <Toggle label="Card previews" hint="Off shows slim title-only pills." checked={settings.card_previews} onChange={(v) => set({ card_previews: v })} />
              </div>
            </Group>

            <Group title="Dashboard">
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <Toggle label="Dashboard" hint="Tap the S on Home to open." checked={dash.enabled} onChange={(v) => updateDash({ enabled: v })} />
                {dash.enabled && (
                  <Toggle label="Start on Dashboard" hint="Opens first each visit." checked={dash.start_on_dashboard} onChange={(v) => updateDash({ start_on_dashboard: v })} />
                )}
              </div>
              {dash.enabled && (
                <>
                  <p className="pt-1 text-xs text-muted-foreground">Clock</p>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    <Toggle label="24-hour time" checked={dash.clock_24h} onChange={(v) => updateDash({ clock_24h: v })} />
                    <Toggle label="Seconds" checked={dash.show_seconds} onChange={(v) => updateDash({ show_seconds: v })} />
                    <Toggle label="Date" checked={dash.show_date} onChange={(v) => updateDash({ show_date: v })} />
                    <Toggle label="Greeting" hint="Good morning, etc." checked={dash.show_greeting} onChange={(v) => updateDash({ show_greeting: v })} />
                  </div>
                  <p className="pt-1 text-xs text-muted-foreground">Widgets</p>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {WIDGETS.map((w) => (
                      <Toggle
                        key={w.key}
                        label={w.label}
                        hint={w.hint}
                        checked={dash.widgets[w.key]}
                        onChange={(v) => updateDash({ widgets: { ...dash.widgets, [w.key]: v } })}
                      />
                    ))}
                  </div>
                  <div className="flex rounded-full bg-muted p-1">
                    {(["f", "c"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => updateDash({ temp_unit: u })}
                        className={cn(
                          "flex-1 rounded-full py-2 text-sm font-medium transition-colors",
                          dash.temp_unit === u ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        °{u.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Group>

            <Group title="AI">
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <Toggle label="Ask Gemini button" checked={settings.show_ask_gemini} onChange={(v) => set({ show_ask_gemini: v })} />
                <Toggle label="Writing suggestions" hint="Press Tab to accept." checked={settings.ghost_autocomplete} onChange={(v) => set({ ghost_autocomplete: v })} />
              </div>
            </Group>

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
