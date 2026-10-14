import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleThreshold } from "./bid-rule-threshold.js";

test("BidRuleThreshold starts in idle", () => {
  const item = newBidRuleThreshold("code-806", "title-883");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleThreshold moves to draining", () => {
  const item = newBidRuleThreshold("code-806", "title-883");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BidRuleThreshold rejects moves from stopped", () => {
  const item = newBidRuleThreshold("code-806", "title-883");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
