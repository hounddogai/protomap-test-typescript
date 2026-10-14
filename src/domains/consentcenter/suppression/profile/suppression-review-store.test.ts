import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionReviewStore } from "./suppression-review-store.js";
import { newSuppressionReview } from "./suppression-review.js";

test("MemorySuppressionReviewStore finds what it saved", () => {
  const store = newMemorySuppressionReviewStore();
  const item = newSuppressionReview("code-124", "name-593");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
