import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSubscriptionReview } from "./adaptive-subscription-review.js";

test("AdaptiveSubscriptionReview starts in proposed", () => {
  const item = newAdaptiveSubscriptionReview("code-347", "name-982");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSubscriptionReview moves to approved", () => {
  const item = newAdaptiveSubscriptionReview("code-347", "name-982");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveSubscriptionReview rejects moves from withdrawn", () => {
  const item = newAdaptiveSubscriptionReview("code-347", "name-982");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
