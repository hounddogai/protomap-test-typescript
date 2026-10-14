import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointReviewStore } from "./touchpoint-review-store.js";
import { newTouchpointReview } from "./touchpoint-review.js";

test("MemoryTouchpointReviewStore finds what it saved", () => {
  const store = newMemoryTouchpointReviewStore();
  const item = newTouchpointReview("code-669", "title-941");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
