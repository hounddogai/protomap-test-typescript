import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("LegacyBidRuleReview starts in open", () => {
  const item = newLegacyBidRuleReview("code-102", "label-128");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBidRuleReview moves to resolved", () => {
  const item = newLegacyBidRuleReview("code-102", "label-128");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyBidRuleReview rejects moves from archived", () => {
  const item = newLegacyBidRuleReview("code-102", "label-128");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
