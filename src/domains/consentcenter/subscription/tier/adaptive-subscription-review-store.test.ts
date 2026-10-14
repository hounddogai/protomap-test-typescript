import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSubscriptionReviewStore } from "./adaptive-subscription-review-store.js";
import { newAdaptiveSubscriptionReview } from "./adaptive-subscription-review.js";

test("MemoryAdaptiveSubscriptionReviewStore finds what it saved", () => {
  const store = newMemoryAdaptiveSubscriptionReviewStore();
  const item = newAdaptiveSubscriptionReview("code-347", "name-982");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
