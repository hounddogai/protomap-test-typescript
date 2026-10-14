import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCsatReviewStore } from "./lenient-csat-review-store.js";
import { newLenientCsatReview } from "./lenient-csat-review.js";

test("MemoryLenientCsatReviewStore finds what it saved", () => {
  const store = newMemoryLenientCsatReviewStore();
  const item = newLenientCsatReview("code-332", "label-891");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
