import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSubscriptionReviewStore } from "./regional-subscription-review-store.js";
import { newRegionalSubscriptionReview } from "./regional-subscription-review.js";

test("MemoryRegionalSubscriptionReviewStore finds what it saved", () => {
  const store = newMemoryRegionalSubscriptionReviewStore();
  const item = newRegionalSubscriptionReview("code-267", "label-681");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
