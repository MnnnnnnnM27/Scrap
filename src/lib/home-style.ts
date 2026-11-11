import { useSyncExternalStore } from "react";
import type { HomeStyle } from "./scrap-types";

const KEY = "scrap.home-style";
const EVENT = "scrap:home-style";

export function parseHomeStyle(value: string | null): HomeStyle {
  return value === "v4.2" ? "v4.2" : "v4.3";
}

function read(): HomeStyle {
  try {
    return parseHomeStyle(localStorage.getItem(KEY));
  } catch {
    return "v4.3";
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

export function setHomeStyle(style: HomeStyle) {
  localStorage.setItem(KEY, style);
  window.dispatchEvent(new Event(EVENT));
}

export function useHomeStyle() {
  return useSyncExternalStore(subscribe, read, () => "v4.3" as HomeStyle);
}