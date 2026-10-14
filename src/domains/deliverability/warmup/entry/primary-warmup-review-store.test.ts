import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryWarmupReviewStore } from "./primary-warmup-review-store.js";
import { newPrimaryWarmupReview } from "./primary-warmup-review.js";

test("MemoryPrimaryWarmupReviewStore finds what it saved", () => {
  const store = newMemoryPrimaryWarmupReviewStore();
  const item = newPrimaryWarmupReview("code-327", "title-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
