import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatReviewStore } from "./csat-review-store.js";
import { newCsatReview } from "./csat-review.js";

test("MemoryCsatReviewStore finds what it saved", () => {
  const store = newMemoryCsatReviewStore();
  const item = newCsatReview("code-583", "label-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
