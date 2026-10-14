import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedEnrollmentReviewStore } from "./capped-enrollment-review-store.js";
import { newCappedEnrollmentReview } from "./capped-enrollment-review.js";

test("MemoryCappedEnrollmentReviewStore finds what it saved", () => {
  const store = newMemoryCappedEnrollmentReviewStore();
  const item = newCappedEnrollmentReview("code-497", "title-35");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
