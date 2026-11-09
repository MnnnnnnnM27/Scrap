import { useSyncExternalStore } from "react";
import type { FolderView } from "./scrap-types";

const KEY = "scrap.folder-view";
const EVENT = "scrap:folder-view";

export function parseFolderView(value: string | null): FolderView {
  return value === "sidebar" ? "sidebar" : "compact";
}

function read(): FolderView {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return parseFolderView(saved);
    const legacy = JSON.parse(localStorage.getItem("scrap.settings") || "{}");
    return parseFolderView(legacy.folder_view);
  } catch {
    return "compact";
  }
}

function subscribe(notify: () => void) {
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function setFolderView(view: FolderView) {
  localStorage.setItem(KEY, view);
  window.dispatchEvent(new Event(EVENT));
}

export function useFolderView() {
  return useSyncExternalStore(subscribe, read, () => "compact" as FolderView);
}