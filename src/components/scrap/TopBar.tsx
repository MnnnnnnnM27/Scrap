import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { ScrapMark } from "@/components/scrap/ScrapLogo";
import { useSettings } from "@/lib/settings";
import type { DocKind } from "@/lib/scrap-types";

export function TopBar({
  kind,
  onAskGemini,
  left,
}: {
  kind: DocKind;
  onAskGemini: () => void;
  left?: ReactNode;
}) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  // Switching type leaves the current document (already autosaved) and opens the other list on Home.
  const goTo = (target: DocKind) => {
    if (target === kind) return;
    void navigate({ to: "/", search: { view: target === "note" ? "notes" : "pages" } });
  };

  return (
    <header className="glass fixed inset-x-3 top-3 z-40 flex items-center gap-2 rounded-full px-2 py-1.5 sm:inset-x-6">
      <Link to="/" aria-label="Scrap home" className="ml-1.5 shrink-0 text-brand">
        <ScrapMark className="h-6 w-6" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-1">{left}</div>
      {!settings.pages_only && <div className="flex items-center rounded-full bg-muted p-0.5 text-[13px]">
        {(["note", "page"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => goTo(k)}
            className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
              k === kind ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "note" ? "Notes" : "Pages"}
          </button>
        ))}
      </div>}
      <Link to="/" aria-label="Home" className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft">
        <Home className="h-[18px] w-[18px]" />
      </Link>
      <Link to="/research" aria-label="Research mode" className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft">
        <Search className="h-[18px] w-[18px]" />
      </Link>
      {settings.show_ask_gemini && (
        <button
          type="button"
          onClick={onAskGemini}
          className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-[13px] font-medium text-brand-foreground hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Ask Gemini</span>
        </button>
      )}
    </header>
  );
}
