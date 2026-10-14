import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWindowReviewStore } from "./weighted-window-review-store.js";
import { newWeightedWindowReview } from "./weighted-window-review.js";

test("MemoryWeightedWindowReviewStore finds what it saved", () => {
  const store = newMemoryWeightedWindowReviewStore();
  const item = newWeightedWindowReview("code-680", "name-317");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
