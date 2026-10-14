import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostReviewStore } from "./post-review-store.js";
import { newPostReview } from "./post-review.js";

test("MemoryPostReviewStore finds what it saved", () => {
  const store = newMemoryPostReviewStore();
  const item = newPostReview("code-398", "label-307");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
