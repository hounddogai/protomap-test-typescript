import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSubscriptionReview } from "./regional-subscription-review.js";

test("RegionalSubscriptionReview starts in requested", () => {
  const item = newRegionalSubscriptionReview("code-267", "label-681");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSubscriptionReview moves to granted", () => {
  const item = newRegionalSubscriptionReview("code-267", "label-681");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalSubscriptionReview rejects moves from expired", () => {
  const item = newRegionalSubscriptionReview("code-267", "label-681");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
