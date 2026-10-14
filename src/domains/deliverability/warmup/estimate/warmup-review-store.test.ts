import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupReviewStore } from "./warmup-review-store.js";
import { newWarmupReview } from "./warmup-review.js";

test("MemoryWarmupReviewStore finds what it saved", () => {
  const store = newMemoryWarmupReviewStore();
  const item = newWarmupReview("code-181", "title-274");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
