import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const APP_VERSION = "3.2";
const KEY = "scrap.seenVersion";
const NOTES = [
  "Collaborate on pages",
  "Live cursors and names",
  "AI tasks as little bubbles",
  "AI chart",
  "Nicer printing",
  "Dividers before big headings",
  "Spellcheck fixed",
  "New font: Outfit",
];

export function WhatsNew() {
  const { settings } = useSettings();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== APP_VERSION) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(KEY, APP_VERSION);
    setShow(false);
  };

  if (!show || !settings.show_whats_new) return null;
  return (
    <div className="no-print fixed top-5 left-1/2 z-50 -translate-x-1/2">
      <button
        type="button"
        onClick={() => (open ? dismiss() : setOpen(true))}
        className={cn(
          "glass animate-pill-in overflow-hidden text-[13px] font-medium transition-all duration-300",
          open ? "w-60 rounded-3xl px-4 py-3 text-left" : "rounded-full px-4 py-1.5 text-brand",
        )}
      >
        {open ? (
          <>
            <p className="mb-1.5 text-brand">v{APP_VERSION}</p>
            <ul className="space-y-0.5 text-[12px] font-normal text-muted-foreground">
              {NOTES.map((n) => <li key={n}>{n}</li>)}
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground/70">Tap to close</p>
          </>
        ) : (
          `v${APP_VERSION}`
        )}
      </button>
    </div>
  );
}
