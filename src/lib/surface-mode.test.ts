import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./scrap-types";
import { parseSurfaceMode, setSurfaceMode } from "./surface-mode";

describe("surface appearance", () => {
  it("keeps the current glass appearance by default", () => {
    expect(DEFAULT_SETTINGS.surface_mode).toBe("glass");
    expect(parseSurfaceMode(null)).toBe("glass");
  });
  it("restores Flat and Glass choices", () => {
    expect(parseSurfaceMode("flat")).toBe("flat");
    expect(parseSurfaceMode("glass")).toBe("glass");
    expect(parseSurfaceMode("invalid")).toBe("glass");
  });
  it("persists each choice and notifies other controls immediately", () => {
    const saved = new Map<string, string>();
    const target = new EventTarget();
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "window", { configurable: true, value: target });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem: (k: string, v: string) => saved.set(k, v) } });
    let notifications = 0;
    target.addEventListener("scrap:surface-mode", () => notifications++);
    try {
      setSurfaceMode("flat");
      expect(saved.get("scrap.surface-mode")).toBe("flat");
      expect(notifications).toBe(1);
      setSurfaceMode("glass");
      expect(saved.get("scrap.surface-mode")).toBe("glass");
      expect(notifications).toBe(2);
    } finally {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
});