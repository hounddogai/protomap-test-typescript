import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWarmupReviewStore } from "./lenient-warmup-review-store.js";
import { newLenientWarmupReview } from "./lenient-warmup-review.js";

test("MemoryLenientWarmupReviewStore finds what it saved", () => {
  const store = newMemoryLenientWarmupReviewStore();
  const item = newLenientWarmupReview("code-662", "label-163");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
