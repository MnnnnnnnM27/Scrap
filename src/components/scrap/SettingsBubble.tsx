import { Link } from "@tanstack/react-router";
import { LayoutList, LogOut, Moon, PanelLeft, PanelRight, Settings, Sun, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import {
  ACCENT_THEMES,
  CANVAS_WIDTHS,
  type AccentTheme,
  type ColorMode,
  type ToolbarSide,
  type UserSettings,
} from "@/lib/scrap-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShortcutSettings } from "./ShortcutSettings";

const ACCENT_SWATCH: Record<AccentTheme, string> = {
  "dark-grey": "oklch(0.34 0.006 265)",
  "blue": "oklch(0.58 0.19 255)",
  "green": "oklch(0.58 0.14 152)",
  "amber": "oklch(0.70 0.16 65)",
  "rose": "oklch(0.60 0.20 15)",
  "violet": "oklch(0.55 0.19 292)",
  "teal": "oklch(0.60 0.10 200)",
  "terracotta": "oklch(0.60 0.14 40)",
  "sage": "oklch(0.60 0.06 145)",
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
            <SheetTitle className="flex items-center gap-2 text-[17px]">Settings <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">v4.2</span></SheetTitle>
          </SheetHeader>

          <div className="space-y-8 px-4 pb-10">
            <ShortcutSettings />
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
                <Toggle label="Word count" hint="Words and reading time." checked={settings.show_word_count} onChange={(v) => set({ show_word_count: v })} />
                <Toggle label="TypeLiner" hint="Keeps your line centered." checked={settings.typeliner} onChange={(v) => set({ typeliner: v })} />
                <Toggle label="/ commands" hint="Type / for tables, charts, more." checked={settings.slash_commands} onChange={(v) => set({ slash_commands: v })} />
                <Toggle label="Spellcheck" checked={settings.spellcheck} onChange={(v) => set({ spellcheck: v })} />
                <Toggle label="Confirm before Trash" checked={settings.confirm_trash} onChange={(v) => set({ confirm_trash: v })} />
              </div>
            </Group>

            <Group title="Home">
              <div>
                <p className="mb-2 text-[15px]">Folder view</p>
                <div className="flex rounded-full bg-muted p-1" role="group" aria-label="Folder view">
                  {(["sidebar", "compact"] as const).map((layout) => (
                    <Button
                      key={layout}
                      variant="ghost"
                      aria-pressed={settings.folder_view === layout}
                      onClick={() => set({ folder_view: layout })}
                      className={cn(
                        "h-10 flex-1 rounded-full capitalize",
                        settings.folder_view === layout
                          ? "bg-brand text-brand-foreground hover:bg-brand hover:text-brand-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {layout === "sidebar" ? <PanelLeft /> : <LayoutList />}
                      {layout}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <Toggle label="Card previews" hint="Off shows slim title-only pills." checked={settings.card_previews} onChange={(v) => set({ card_previews: v })} />
                <Toggle label="Pages only" hint="Hides Notes. Home becomes Pages." checked={settings.pages_only} onChange={(v) => set({ pages_only: v })} />
              </div>
            </Group>

            <Group title="Collaboration">
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                <div className="flex min-h-11 items-center justify-between gap-4 px-3.5 py-2.5">
                  <p className="text-[15px]">Username</p>
                  <input
                    defaultValue={settings.username}
                    key={settings.username}
                    maxLength={24}
                    placeholder="Your name"
                    onBlur={(e) => set({ username: e.target.value.trim() })}
                    className="w-36 rounded-lg bg-muted px-2.5 py-1 text-right text-sm outline-none"
                  />
                </div>
                <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-3.5 py-2.5">
                  <span>
                    <span className="block text-[15px]">Your colour</span>
                    <span className="block text-xs text-muted-foreground">Your C and cursor.</span>
                  </span>
                  <input
                    type="color"
                    value={settings.collab_color}
                    onChange={(e) => set({ collab_color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                </label>
                <Toggle label="Live cursors" hint="See where others type." checked={settings.show_cursors} onChange={(v) => set({ show_cursors: v })} />
                <Toggle label="Names on cursors" checked={settings.show_names} onChange={(v) => set({ show_names: v })} />
              </div>
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
