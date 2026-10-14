import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRewardReviewStore } from "./manual-reward-review-store.js";
import { newManualRewardReview } from "./manual-reward-review.js";

test("MemoryManualRewardReviewStore finds what it saved", () => {
  const store = newMemoryManualRewardReviewStore();
  const item = newManualRewardReview("code-526", "name-680");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
