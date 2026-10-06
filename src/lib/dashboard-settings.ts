import { useCallback, useEffect, useState } from "react";

export type WidgetKey = "weather" | "tasks" | "notes" | "pages" | "capture" | "focus" | "stats";

export const WIDGETS: { key: WidgetKey; label: string; hint: string }[] = [
  { key: "weather", label: "Weather", hint: "Local forecast." },
  { key: "tasks", label: "Tasks", hint: "Open checklist items." },
  { key: "notes", label: "Recent notes", hint: "Last three notes." },
  { key: "pages", label: "Recent pages", hint: "Last three pages." },
  { key: "capture", label: "Quick note", hint: "Jot, saves as a note." },
  { key: "focus", label: "Focus timer", hint: "25-minute sessions." },
  { key: "stats", label: "Writing stats", hint: "Words and documents." },
];

export type DashboardSettings = {
  enabled: boolean;
  start_on_dashboard: boolean;
  clock_24h: boolean;
  show_seconds: boolean;
  show_date: boolean;
  show_greeting: boolean;
  temp_unit: "f" | "c";
  widgets: Record<WidgetKey, boolean>;
};

export const DEFAULT_DASHBOARD: DashboardSettings = {
  enabled: true,
  start_on_dashboard: false,
  clock_24h: false,
  show_seconds: false,
  show_date: true,
  show_greeting: true,
  temp_unit: "f",
  widgets: { weather: true, tasks: true, notes: true, pages: true, capture: true, focus: false, stats: false },
};

const KEY = "scrap.dashboard";
const EVT = "scrap-dashboard-change";

function read(): DashboardSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DASHBOARD;
    const v = JSON.parse(raw) as Partial<DashboardSettings>;
    return { ...DEFAULT_DASHBOARD, ...v, widgets: { ...DEFAULT_DASHBOARD.widgets, ...(v.widgets ?? {}) } };
  } catch {
    return DEFAULT_DASHBOARD;
  }
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD);
  useEffect(() => {
    setSettings(read());
    const sync = () => setSettings(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((patch: Partial<DashboardSettings>) => {
    const next = { ...read(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { dash: settings, updateDash: update, readDash: read };
}
