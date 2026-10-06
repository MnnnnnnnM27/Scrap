import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, Cloud, CloudRain, CloudSnow, CloudSun, FileText, Pause, Play, RotateCcw, StickyNote, Sun, Timer, PenLine, ListChecks, BarChart3, CloudLightning, CloudFog } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/scrap/AuthGate";
import { ScrapMark } from "@/components/scrap/ScrapLogo";
import { SettingsBubble } from "@/components/scrap/SettingsBubble";
import { createDocument, listDocuments, saveDocument } from "@/lib/documents";
import { useDashboardSettings, type WidgetKey } from "@/lib/dashboard-settings";
import type { ScrapDocument } from "@/lib/scrap-types";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Scrap" },
      { name: "description", content: "A calm glance at your day: time, weather, tasks and recent writing." },
      { property: "og:title", content: "Dashboard — Scrap" },
      { property: "og:description", content: "A calm glance at your day: time, weather, tasks and recent writing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

function useNow(seconds: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), seconds ? 1000 : 10_000);
    return () => clearInterval(t);
  }, [seconds]);
  return now;
}

function Dashboard() {
  const { dash } = useDashboardSettings();
  const now = useNow(dash.show_seconds);
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments(false) });

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    ...(dash.show_seconds ? { second: "2-digit" } : {}),
    hour12: !dash.clock_24h,
  });
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const h = now.getHours();
  const greeting = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const order: WidgetKey[] = ["weather", "tasks", "notes", "pages", "capture", "focus", "stats"];
  const active = order.filter((k) => dash.widgets[k]);

  return (
    <div className="min-h-screen pb-24">
      <SettingsBubble />
      <div className="mx-auto max-w-5xl px-6 pt-20 sm:px-10">
        <header className="flex flex-col items-center text-center animate-pill-in">
          <Link to="/" aria-label="Go to Home" title="Home" className="rounded-2xl text-brand transition-transform duration-200 hover:scale-105 active:scale-95">
            <ScrapMark className="h-14 w-14" />
          </Link>
          {dash.show_greeting && <p className="mt-5 text-[15px] text-muted-foreground">{greeting}</p>}
          <h1 className="mt-1 text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl">{time}</h1>
          {dash.show_date && <p className="mt-2 text-[15px] text-muted-foreground">{date}</p>}
        </header>

        {active.length > 0 && (
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((k) => (
              <div key={k} className="animate-pill-in">
                {k === "weather" && <WeatherWidget unit={dash.temp_unit} />}
                {k === "tasks" && <TasksWidget docs={docs} />}
                {k === "notes" && <RecentWidget docs={docs} kind="note" />}
                {k === "pages" && <RecentWidget docs={docs} kind="page" />}
                {k === "capture" && <CaptureWidget />}
                {k === "focus" && <FocusWidget />}
                {k === "stats" && <StatsWidget docs={docs} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, icon, children, to }: { title: string; icon: ReactNode; children: ReactNode; to?: { view: "notes" | "pages" } }) {
  const head = (
    <div className="mb-3 flex items-center gap-2 text-brand">
      {icon}
      <h2 className="text-[12px] font-semibold tracking-[0.12em] uppercase">{title}</h2>
    </div>
  );
  return (
    <section className="h-full min-h-[168px] rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      {to ? (
        <Link to="/" search={to} className="block hover:opacity-80">{head}</Link>
      ) : (
        head
      )}
      {children}
    </section>
  );
}

const WEATHER_ICON = (code: number) =>
  code === 0 ? Sun : code <= 2 ? CloudSun : code <= 3 ? Cloud : code <= 48 ? CloudFog : code <= 67 || (code >= 80 && code <= 82) ? CloudRain : code <= 77 || code === 85 || code === 86 ? CloudSnow : CloudLightning;
const WEATHER_LABEL = (code: number) =>
  code === 0 ? "Clear" : code <= 2 ? "Partly cloudy" : code <= 3 ? "Cloudy" : code <= 48 ? "Fog" : code <= 67 ? "Rain" : code <= 77 ? "Snow" : code <= 82 ? "Showers" : code <= 86 ? "Snow showers" : "Storms";

type Weather = { temp: number; code: number; hi: number; lo: number };

function WeatherWidget({ unit }: { unit: "f" | "c" }) {
  const [w, setW] = useState<Weather | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return setErr("Location unavailable.");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const u = unit === "f" ? "&temperature_unit=fahrenheit" : "";
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1${u}`,
          );
          const j = await r.json();
          setW({ temp: j.current.temperature_2m, code: j.current.weather_code, hi: j.daily.temperature_2m_max[0], lo: j.daily.temperature_2m_min[0] });
        } catch {
          setErr("Couldn't load weather.");
        }
      },
      () => setErr("Allow location to see weather."),
      { maximumAge: 30 * 60 * 1000 },
    );
  }, [unit]);
  const Icon = w ? WEATHER_ICON(w.code) : Cloud;
  return (
    <Card title="Weather" icon={<Icon className="h-4 w-4" />}>
      {w ? (
        <div>
          <p className="text-4xl font-semibold tracking-tight">{Math.round(w.temp)}°</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {WEATHER_LABEL(w.code)} · H {Math.round(w.hi)}° L {Math.round(w.lo)}°
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{err ?? "Loading…"}</p>
      )}
    </Card>
  );
}

type Task = { text: string; doc: ScrapDocument };
function collectTasks(node: unknown, out: string[]) {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; attrs?: { checked?: boolean }; content?: unknown[]; text?: string };
  if (n.type === "taskItem") {
    if (!n.attrs?.checked) {
      const parts: string[] = [];
      const walk = (x: unknown) => {
        const y = x as { text?: string; content?: unknown[]; type?: string };
        if (y?.type === "taskList") return;
        if (y?.text) parts.push(y.text);
        y?.content?.forEach(walk);
      };
      n.content?.forEach(walk);
      const t = parts.join("").trim();
      if (t) out.push(t);
    }
  }
  n.content?.forEach((c) => collectTasks(c, out));
}

function TasksWidget({ docs }: { docs: ScrapDocument[] }) {
  const tasks = useMemo(() => {
    const list: Task[] = [];
    for (const doc of docs) {
      const out: string[] = [];
      collectTasks(doc.content, out);
      out.forEach((text) => list.push({ text, doc }));
    }
    return list;
  }, [docs]);
  return (
    <Card title={`Tasks${tasks.length ? ` · ${tasks.length}` : ""}`} icon={<ListChecks className="h-4 w-4" />}>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">All clear.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.slice(0, 5).map((t, i) => (
            <li key={i}>
              <Link to="/note/$id" params={{ id: t.doc.id }} className="flex items-start gap-2 text-sm hover:text-brand">
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{t.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

function RecentWidget({ docs, kind }: { docs: ScrapDocument[]; kind: "note" | "page" }) {
  const list = docs.filter((d) => d.kind === kind).slice(0, 3);
  return (
    <Card
      title={kind === "note" ? "Notes" : "Pages"}
      icon={kind === "note" ? <StickyNote className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      to={{ view: kind === "note" ? "notes" : "pages" }}
    >
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((d) => (
            <li key={d.id}>
              <Link
                to={kind === "note" ? "/note/$id" : "/page/$id"}
                params={{ id: d.id }}
                className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="truncate">{d.title || "Untitled"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{ago(d.updated_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CaptureWidget() {
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: async (value: string) => {
      const doc = await createDocument("note");
      const lines = value.split("\n");
      const content = {
        type: "doc",
        content: lines.map((l) => (l.trim() ? { type: "paragraph", content: [{ type: "text", text: l }] } : { type: "paragraph" })),
      };
      await saveDocument(doc.id, { title: lines[0]!.slice(0, 60), content: content as Json, plain_text: value });
    },
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Saved to Notes");
    },
    onError: () => toast.error("Couldn't save that."),
  });
  return (
    <Card title="Quick note" icon={<PenLine className="h-4 w-4" />}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) save.mutate(text.trim());
        }}
        placeholder="Jot something…"
        rows={3}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">⌘ Enter</span>
        <button
          type="button"
          disabled={!text.trim() || save.isPending}
          onClick={() => save.mutate(text.trim())}
          className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground transition-opacity disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </Card>
  );
}

function FocusWidget() {
  const TOTAL = 25 * 60;
  const [left, setLeft] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          toast.success("Focus session done");
          return TOTAL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, TOTAL]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <Card title="Focus" icon={<Timer className="h-4 w-4" />}>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">{mm}:{ss}</p>
        <div className="flex gap-1.5">
          <button type="button" aria-label={running ? "Pause" : "Start"} onClick={() => setRunning((r) => !r)} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Reset" onClick={() => { setRunning(false); setLeft(TOTAL); }} className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-brand transition-all" style={{ width: `${((TOTAL - left) / TOTAL) * 100}%` }} />
      </div>
    </Card>
  );
}

function StatsWidget({ docs }: { docs: ScrapDocument[] }) {
  const words = docs.reduce((n, d) => n + (d.plain_text.trim() ? d.plain_text.trim().split(/\s+/).length : 0), 0);
  const week = docs.filter((d) => Date.now() - new Date(d.updated_at).getTime() < 7 * 864e5).length;
  return (
    <Card title="Writing" icon={<BarChart3 className="h-4 w-4" />}>
      <div className="grid grid-cols-3 gap-2">
        {[
          [words.toLocaleString(), "words"],
          [String(docs.length), "docs"],
          [String(week), "this week"],
        ].map(([v, l]) => (
          <div key={l}>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{v}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
