import { useSyncExternalStore } from "react";
import type { SurfaceMode } from "./scrap-types";

const KEY = "scrap.surface-mode";
const EVENT = "scrap:surface-mode";

export function parseSurfaceMode(value: string | null): SurfaceMode {
  return value === "flat" ? "flat" : "glass";
}

function read(): SurfaceMode {
  try {
    return parseSurfaceMode(localStorage.getItem(KEY));
  } catch {
    return "glass";
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

export function setSurfaceMode(mode: SurfaceMode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event(EVENT));
}

export function useSurfaceMode() {
  return useSyncExternalStore(subscribe, read, () => "glass" as SurfaceMode);
}