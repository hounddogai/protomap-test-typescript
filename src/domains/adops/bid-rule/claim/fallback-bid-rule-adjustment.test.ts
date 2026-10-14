import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

test("FallbackBidRuleAdjustment starts in proposed", () => {
  const item = newFallbackBidRuleAdjustment("code-905", "title-779");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBidRuleAdjustment moves to rejected", () => {
  const item = newFallbackBidRuleAdjustment("code-905", "title-779");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackBidRuleAdjustment rejects moves from withdrawn", () => {
  const item = newFallbackBidRuleAdjustment("code-905", "title-779");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
