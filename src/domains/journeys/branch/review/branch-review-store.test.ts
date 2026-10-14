import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchReviewStore } from "./branch-review-store.js";
import { newBranchReview } from "./branch-review.js";

test("MemoryBranchReviewStore finds what it saved", () => {
  const store = newMemoryBranchReviewStore();
  const item = newBranchReview("code-566", "label-468");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
