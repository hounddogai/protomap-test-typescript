import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroReviewStore } from "./macro-review-store.js";
import { newMacroReview } from "./macro-review.js";

test("MemoryMacroReviewStore finds what it saved", () => {
  const store = newMemoryMacroReviewStore();
  const item = newMacroReview("code-740", "label-499");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
