import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeReviewStore } from "./badge-review-store.js";
import { newBadgeReview } from "./badge-review.js";

test("MemoryBadgeReviewStore finds what it saved", () => {
  const store = newMemoryBadgeReviewStore();
  const item = newBadgeReview("code-908", "name-931");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
