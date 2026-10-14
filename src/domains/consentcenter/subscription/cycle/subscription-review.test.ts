import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionReview } from "./subscription-review.js";

test("SubscriptionReview starts in created", () => {
  const item = newSubscriptionReview("code-399", "title-605");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionReview moves to retired", () => {
  const item = newSubscriptionReview("code-399", "title-605");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SubscriptionReview rejects moves from retired", () => {
  const item = newSubscriptionReview("code-399", "title-605");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
