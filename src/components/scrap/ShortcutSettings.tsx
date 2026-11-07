import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comboFromEvent, DEFAULT_SHORTCUTS, prettyCombo, saveShortcuts, SHORTCUT_LABELS, useShortcuts, type ShortcutAction } from "@/lib/shortcuts";

export function ShortcutSettings() {
  const shortcuts = useShortcuts();
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [error, setError] = useState("");
  return <section className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-xs font-medium uppercase text-muted-foreground">Shortcuts</h3><Button variant="ghost" size="icon" aria-label="Reset shortcuts" title="Reset shortcuts" onClick={() => { saveShortcuts(DEFAULT_SHORTCUTS); setRecording(null); setError(""); }}><RotateCcw /></Button></div>
    <div className="divide-y divide-border rounded-xl border border-border">
      {(Object.keys(SHORTCUT_LABELS) as ShortcutAction[]).map(action => <div key={action} className="flex items-center justify-between gap-3 px-3.5 py-2">
        <span className="text-sm">{SHORTCUT_LABELS[action]}</span>
        <Button variant="outline" size="sm" aria-label={`Change ${SHORTCUT_LABELS[action]} shortcut`} onClick={() => { setRecording(action); setError(""); }} onBlur={() => setRecording(null)} onKeyDown={event => {
          if (recording !== action) return;
          event.preventDefault(); event.stopPropagation();
          if (event.key === "Escape") { setRecording(null); return; }
          const combo = comboFromEvent(event.nativeEvent);
          if (!combo) return;
          if (!event.metaKey && !event.ctrlKey && !event.altKey) { setError("Include Command, Control, or Option."); return; }
          if (Object.entries(shortcuts).some(([key, value]) => key !== action && value === combo)) { setError("That shortcut is already in use."); return; }
          saveShortcuts({ ...shortcuts, [action]: combo }); setRecording(null); setError("");
        }}>{recording === action ? "Press keys…" : prettyCombo(shortcuts[action])}</Button>
      </div>)}
      <label className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">Command trigger<input aria-label="Command trigger" maxLength={1} value={shortcuts.slashTrigger} onChange={event => { const value = event.target.value; if (value && /[^\w\s]/.test(value)) saveShortcuts({ ...shortcuts, slashTrigger: value }); }} className="h-8 w-12 rounded-md border border-input bg-background text-center" /></label>
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}