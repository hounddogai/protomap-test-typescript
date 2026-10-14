import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPostReviewStore } from "./tiered-post-review-store.js";
import { newTieredPostReview } from "./tiered-post-review.js";

test("MemoryTieredPostReviewStore finds what it saved", () => {
  const store = newMemoryTieredPostReviewStore();
  const item = newTieredPostReview("code-65", "title-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
