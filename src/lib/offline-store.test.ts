import { beforeEach, describe, expect, it } from "vitest";
import { acknowledgeSave, cachedDocuments, cacheDocuments, offlineQueue, setOfflineAccount, stageDocumentSave } from "./offline-store";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) }, configurable: true });

beforeEach(() => { storage.clear(); setOfflineAccount("account-a"); });
describe("offline saves", () => {
  it("keeps edits isolated to the signed-in account", () => {
    stageDocumentSave("page", { title: "Private page" });
    setOfflineAccount("account-b");
    expect(offlineQueue()).toEqual({});
    expect(cachedDocuments()).toEqual({});
    setOfflineAccount("account-a");
    expect(offlineQueue().page?.patch.title).toBe("Private page");
  });
  it("persists edits immediately before any debounce", () => {
    stageDocumentSave("page", { plain_text: "Saved before leaving" });
    expect(JSON.parse(storage.get("scrap.offline.account-a.queue") ?? "{}").page.patch.plain_text).toBe("Saved before leaving");
  });
  it("does not acknowledge an edit made during an earlier save", () => {
    stageDocumentSave("page", { title: "First" });
    const first = offlineQueue().page;
    expect(first).toBeDefined();
    if (!first) return;
    stageDocumentSave("page", { title: "Second" });
    acknowledgeSave("page", first.revision);
    expect(offlineQueue().page?.patch.title).toBe("Second");
  });
  it("never reuses revisions after an acknowledged save", () => {
    stageDocumentSave("page", { title: "First" });
    const first = offlineQueue().page;
    expect(first).toBeDefined();
    if (!first) return;
    acknowledgeSave("page", first.revision);
    stageDocumentSave("page", { title: "Second" });
    acknowledgeSave("page", first.revision);
    expect(offlineQueue().page?.patch.title).toBe("Second");
  });
  it("retains queued edits when cloud snapshots refresh", () => {
    stageDocumentSave("page", { title: "Local title" });
    cacheDocuments([{ id: "page", title: "Old title" } as Parameters<typeof cacheDocuments>[0][number]]);
    expect(cachedDocuments().page?.title).toBe("Local title");
  });
});