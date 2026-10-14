import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardReviewStore } from "./weighted-reward-review-store.js";
import { newWeightedRewardReview } from "./weighted-reward-review.js";

test("MemoryWeightedRewardReviewStore finds what it saved", () => {
  const store = newMemoryWeightedRewardReviewStore();
  const item = newWeightedRewardReview("code-910", "title-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
