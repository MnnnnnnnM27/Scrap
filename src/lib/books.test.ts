import { expect, it } from "vitest";
import { bookMetadata } from "./books";
it("restores cover, author and writing target metadata without altering document kind", () => {
  expect(bookMetadata({ author: "MnM", front_cover: "data:image/png;base64,a", word_target: 2500 }).author).toBe("MnM");
  expect(bookMetadata({ word_target: 2500 }).word_target).toBe(2500);
  expect(bookMetadata(null).word_target).toBe(10000);
});