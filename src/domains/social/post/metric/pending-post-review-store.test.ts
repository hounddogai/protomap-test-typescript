import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPostReviewStore } from "./pending-post-review-store.js";
import { newPendingPostReview } from "./pending-post-review.js";

test("MemoryPendingPostReviewStore finds what it saved", () => {
  const store = newMemoryPendingPostReviewStore();
  const item = newPendingPostReview("code-188", "title-534");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
