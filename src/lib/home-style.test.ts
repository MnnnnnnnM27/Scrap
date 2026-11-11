import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./scrap-types";
import { parseHomeStyle, setHomeStyle } from "./home-style";

describe("Home style choice", () => {
  it("retains v4.3 by default and restores either version", () => {
    expect(DEFAULT_SETTINGS.home_style).toBe("v4.3");
    expect(parseHomeStyle(null)).toBe("v4.3");
    expect(parseHomeStyle("invalid")).toBe("v4.3");
    expect(parseHomeStyle("v4.2")).toBe("v4.2");
    expect(parseHomeStyle("v4.3")).toBe("v4.3");
  });
  it("switches both styles without changing Flat/Glass or folder view", () => {
    const saved = new Map([["scrap.surface-mode", "flat"], ["scrap.folder-view", "sidebar"]]);
    const target = new EventTarget();
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "window", { configurable: true, value: target });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem: (k: string, v: string) => saved.set(k, v) } });
    let notifications = 0;
    target.addEventListener("scrap:home-style", () => notifications++);
    try {
      for (const style of ["v4.2", "v4.3"] as const) {
        setHomeStyle(style);
        expect(saved.get("scrap.home-style")).toBe(style);
        expect(saved.get("scrap.surface-mode")).toBe("flat");
        expect(saved.get("scrap.folder-view")).toBe("sidebar");
      }
      expect(notifications).toBe(2);
    } finally {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
});