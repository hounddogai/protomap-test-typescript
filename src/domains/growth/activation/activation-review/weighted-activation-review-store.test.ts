import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedActivationReviewStore } from "./weighted-activation-review-store.js";
import { newWeightedActivationReview } from "./weighted-activation-review.js";

test("MemoryWeightedActivationReviewStore finds what it saved", () => {
  const store = newMemoryWeightedActivationReviewStore();
  const item = newWeightedActivationReview("code-588", "name-93");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
