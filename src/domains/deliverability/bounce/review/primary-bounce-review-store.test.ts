import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBounceReviewStore } from "./primary-bounce-review-store.js";
import { newPrimaryBounceReview } from "./primary-bounce-review.js";

test("MemoryPrimaryBounceReviewStore finds what it saved", () => {
  const store = newMemoryPrimaryBounceReviewStore();
  const item = newPrimaryBounceReview("code-640", "title-640");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
