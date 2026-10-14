import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentReviewStore } from "./enrollment-review-store.js";
import { newEnrollmentReview } from "./enrollment-review.js";

test("MemoryEnrollmentReviewStore finds what it saved", () => {
  const store = newMemoryEnrollmentReviewStore();
  const item = newEnrollmentReview("code-250", "name-594");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
