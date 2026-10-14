import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMentionReviewStore } from "./scheduled-mention-review-store.js";
import { newScheduledMentionReview } from "./scheduled-mention-review.js";

test("MemoryScheduledMentionReviewStore finds what it saved", () => {
  const store = newMemoryScheduledMentionReviewStore();
  const item = newScheduledMentionReview("code-320", "title-328");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
