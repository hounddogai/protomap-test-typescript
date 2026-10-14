import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRewardReviewStore } from "./batched-reward-review-store.js";
import { newBatchedRewardReview } from "./batched-reward-review.js";

test("MemoryBatchedRewardReviewStore finds what it saved", () => {
  const store = newMemoryBatchedRewardReviewStore();
  const item = newBatchedRewardReview("code-853", "label-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
