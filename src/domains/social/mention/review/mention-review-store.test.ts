import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionReviewStore } from "./mention-review-store.js";
import { newMentionReview } from "./mention-review.js";

test("MemoryMentionReviewStore finds what it saved", () => {
  const store = newMemoryMentionReviewStore();
  const item = newMentionReview("code-146", "label-604");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
