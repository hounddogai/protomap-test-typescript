import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMentionReviewStore } from "./batched-mention-review-store.js";
import { newBatchedMentionReview } from "./batched-mention-review.js";

test("MemoryBatchedMentionReviewStore finds what it saved", () => {
  const store = newMemoryBatchedMentionReviewStore();
  const item = newBatchedMentionReview("code-626", "title-92");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
