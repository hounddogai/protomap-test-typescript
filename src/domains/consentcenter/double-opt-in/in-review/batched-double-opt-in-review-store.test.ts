import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedDoubleOptInReviewStore } from "./batched-double-opt-in-review-store.js";
import { newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("MemoryBatchedDoubleOptInReviewStore finds what it saved", () => {
  const store = newMemoryBatchedDoubleOptInReviewStore();
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
