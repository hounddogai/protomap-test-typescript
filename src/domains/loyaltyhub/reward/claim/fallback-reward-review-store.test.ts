import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRewardReviewStore } from "./fallback-reward-review-store.js";
import { newFallbackRewardReview } from "./fallback-reward-review.js";

test("MemoryFallbackRewardReviewStore finds what it saved", () => {
  const store = newMemoryFallbackRewardReviewStore();
  const item = newFallbackRewardReview("code-296", "name-142");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
