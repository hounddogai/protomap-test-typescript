import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBidRuleRollup } from "./tiered-bid-rule-rollup.js";

test("TieredBidRuleRollup starts in open", () => {
  const item = newTieredBidRuleRollup("code-180", "label-743");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBidRuleRollup moves to archived", () => {
  const item = newTieredBidRuleRollup("code-180", "label-743");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("TieredBidRuleRollup rejects moves from archived", () => {
  const item = newTieredBidRuleRollup("code-180", "label-743");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
