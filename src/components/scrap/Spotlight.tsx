import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, FileText, StickyNote } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { listDocuments } from "@/lib/documents";
import { useSettings } from "@/lib/settings";
import { searchDocuments } from "@/lib/spotlight";

export function Spotlight({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { data = [], isPending, isError } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments(), enabled: open });
  const results = searchDocuments(data, query, settings.pages_only);
  return <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setQuery(""); }}>
    <DialogContent aria-describedby={undefined} className="glass top-[22%] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-lg p-0 shadow-glass">
      <DialogTitle className="sr-only">Spotlight</DialogTitle>
      <Command shouldFilter={false} className="bg-transparent">
        <CommandInput autoFocus aria-label="Spotlight search" placeholder="Search Scrap" value={query} onValueChange={setQuery} className="h-16 pr-10 text-lg" />
        <CommandList className="max-h-[min(50vh,420px)] p-2">
          <CommandEmpty>{isPending ? "Loading…" : isError ? "Couldn't load your documents." : "No results."}</CommandEmpty>
          <CommandGroup heading={query ? "Results" : "Recent"}>
            {results.map(doc => <CommandItem key={doc.id} value={doc.id} className="min-h-12 gap-3" onSelect={() => { onOpenChange(false); setQuery(""); void navigate({ to: doc.kind === "note" ? "/note/$id" : "/page/$id", params: { id: doc.id } }); }}>
              {doc.book ? <BookOpen /> : doc.kind === "page" ? <FileText /> : <StickyNote />}
              <span className="min-w-0 flex-1 truncate">{doc.title || "Untitled"}</span><span className="text-xs text-muted-foreground">{doc.book ? "Book" : doc.kind === "page" ? "Page" : "Note"}</span>
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
    </DialogContent>
  </Dialog>;
}