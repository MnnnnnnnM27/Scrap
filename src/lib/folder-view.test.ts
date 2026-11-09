import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./scrap-types";

describe("folder view preference", () => {
  it("keeps the compact folder view as the default", () => {
    expect(DEFAULT_SETTINGS.folder_view).toBe("compact");
  });
});