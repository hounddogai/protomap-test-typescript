import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBidRuleReview } from "./capped-bid-rule-review.js";

test("CappedBidRuleReview starts in requested", () => {
  const item = newCappedBidRuleReview("code-314", "title-453");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBidRuleReview moves to expired", () => {
  const item = newCappedBidRuleReview("code-314", "title-453");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("CappedBidRuleReview rejects moves from expired", () => {
  const item = newCappedBidRuleReview("code-314", "title-453");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
