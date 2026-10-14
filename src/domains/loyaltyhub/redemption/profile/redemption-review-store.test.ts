import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionReviewStore } from "./redemption-review-store.js";
import { newRedemptionReview } from "./redemption-review.js";

test("MemoryRedemptionReviewStore finds what it saved", () => {
  const store = newMemoryRedemptionReviewStore();
  const item = newRedemptionReview("code-549", "title-181");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
