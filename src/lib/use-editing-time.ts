import { useEffect, useRef, useState, type RefObject } from "react";
import { editingDelta } from "./editing-time";

export function useEditingTime(initial: number, root: RefObject<HTMLElement | null>, enabled: boolean, save: (seconds: number) => void) {
  const [seconds, setSeconds] = useState(initial);
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    if (!enabled) return;
    const element = root.current;
    if (!element) return;
    let total = initial;
    let previous = Date.now();
    let activity = -Infinity;
    let lastSaved = initial;
    const tick = (persist = false) => {
      const now = Date.now();
      total += editingDelta(previous, now, activity, document.visibilityState === "visible" && document.hasFocus() && element.contains(document.activeElement));
      previous = now;
      setSeconds(total);
      if (total > lastSaved && (persist || total - lastSaved >= 5)) { lastSaved = total; saveRef.current(total); }
    };
    const interact = () => { tick(); activity = Date.now(); };
    const leave = () => tick(true);
    element.addEventListener("input", interact);
    element.addEventListener("keydown", interact);
    element.addEventListener("pointerdown", interact);
    element.addEventListener("focusin", interact);
    element.addEventListener("focusout", leave);
    document.addEventListener("visibilitychange", leave);
    window.addEventListener("pagehide", leave);
    const timer = setInterval(tick, 1000);
    return () => {
      tick(true); clearInterval(timer);
      element.removeEventListener("input", interact); element.removeEventListener("keydown", interact); element.removeEventListener("pointerdown", interact); element.removeEventListener("focusin", interact); element.removeEventListener("focusout", leave);
      document.removeEventListener("visibilitychange", leave); window.removeEventListener("pagehide", leave);
    };
  }, [enabled, initial, root]);
  return seconds;
}