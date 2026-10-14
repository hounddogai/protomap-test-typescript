import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleReview } from "./bid-rule-review.js";

test("BidRuleReview starts in proposed", () => {
  const item = newBidRuleReview("code-480", "title-134");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleReview moves to rejected", () => {
  const item = newBidRuleReview("code-480", "title-134");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BidRuleReview rejects moves from withdrawn", () => {
  const item = newBidRuleReview("code-480", "title-134");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
