import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSubscriptionReview } from "./strict-subscription-review.js";

test("StrictSubscriptionReview starts in proposed", () => {
  const item = newStrictSubscriptionReview("code-374", "label-678");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSubscriptionReview moves to approved", () => {
  const item = newStrictSubscriptionReview("code-374", "label-678");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictSubscriptionReview rejects moves from withdrawn", () => {
  const item = newStrictSubscriptionReview("code-374", "label-678");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
