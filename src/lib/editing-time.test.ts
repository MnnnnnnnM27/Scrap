import { expect, it } from "vitest";
import { editingDelta, formatEditingTime } from "./editing-time";
it("measures actual editing minutes rather than word-based estimates", () => {
  expect(editingDelta(0, 60000, 50000, true)).toBe(60);
  expect(formatEditingTime(125)).toBe("2:05");
  expect(formatEditingTime(0)).toBe("0:00");
});
it("pauses for hidden, unfocused, or idle editors", () => {
  expect(editingDelta(1000, 2000, 1000, false)).toBe(0);
  expect(editingDelta(60000, 90000, 0, true)).toBe(0);
  expect(editingDelta(59000, 61000, 0, true)).toBe(1);
});