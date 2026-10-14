import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutReview } from "./payout-review.js";

test("PayoutReview starts in requested", () => {
  const item = newPayoutReview("code-222", "label-84");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutReview moves to granted", () => {
  const item = newPayoutReview("code-222", "label-84");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PayoutReview rejects moves from expired", () => {
  const item = newPayoutReview("code-222", "label-84");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
