import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./scrap-types";
import { parseFolderView } from "./folder-view";

describe("folder view preference", () => {
  it("keeps the compact folder view as the default", () => {
    expect(DEFAULT_SETTINGS.folder_view).toBe("compact");
  });
  it("restores a saved Sidebar selection", () => {
    expect(parseFolderView("sidebar")).toBe("sidebar");
  });
  it("restores a saved Compact selection", () => {
    expect(parseFolderView("compact")).toBe("compact");
  });
});