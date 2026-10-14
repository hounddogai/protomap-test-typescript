import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEnrollmentReviewStore } from "./global-enrollment-review-store.js";
import { newGlobalEnrollmentReview } from "./global-enrollment-review.js";

test("MemoryGlobalEnrollmentReviewStore finds what it saved", () => {
  const store = newMemoryGlobalEnrollmentReviewStore();
  const item = newGlobalEnrollmentReview("code-593", "label-154");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
