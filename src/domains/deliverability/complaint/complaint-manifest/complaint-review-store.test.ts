import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintReviewStore } from "./complaint-review-store.js";
import { newComplaintReview } from "./complaint-review.js";

test("MemoryComplaintReviewStore finds what it saved", () => {
  const store = newMemoryComplaintReviewStore();
  const item = newComplaintReview("code-114", "label-334");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
