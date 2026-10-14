import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditReviewStore } from "./credit-review-store.js";
import { newCreditReview } from "./credit-review.js";

test("MemoryCreditReviewStore finds what it saved", () => {
  const store = newMemoryCreditReviewStore();
  const item = newCreditReview("code-991", "label-799");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
