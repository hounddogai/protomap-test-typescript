import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPacingReviewStore } from "./primary-pacing-review-store.js";
import { newPrimaryPacingReview } from "./primary-pacing-review.js";

test("MemoryPrimaryPacingReviewStore finds what it saved", () => {
  const store = newMemoryPrimaryPacingReviewStore();
  const item = newPrimaryPacingReview("code-134", "title-136");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
