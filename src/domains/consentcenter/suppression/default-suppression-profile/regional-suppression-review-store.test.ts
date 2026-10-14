import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSuppressionReviewStore } from "./regional-suppression-review-store.js";
import { newRegionalSuppressionReview } from "./regional-suppression-review.js";

test("MemoryRegionalSuppressionReviewStore finds what it saved", () => {
  const store = newMemoryRegionalSuppressionReviewStore();
  const item = newRegionalSuppressionReview("code-68", "name-964");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
