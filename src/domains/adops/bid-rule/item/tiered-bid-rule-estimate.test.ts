import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

test("TieredBidRuleEstimate starts in idle", () => {
  const item = newTieredBidRuleEstimate("code-790", "title-863");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBidRuleEstimate moves to draining", () => {
  const item = newTieredBidRuleEstimate("code-790", "title-863");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredBidRuleEstimate rejects moves from stopped", () => {
  const item = newTieredBidRuleEstimate("code-790", "title-863");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
