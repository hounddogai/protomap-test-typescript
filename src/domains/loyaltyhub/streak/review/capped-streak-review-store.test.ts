import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStreakReviewStore } from "./capped-streak-review-store.js";
import { newCappedStreakReview } from "./capped-streak-review.js";

test("MemoryCappedStreakReviewStore finds what it saved", () => {
  const store = newMemoryCappedStreakReviewStore();
  const item = newCappedStreakReview("code-174", "label-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
