import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

test("TieredBidRuleBundle starts in planned", () => {
  const item = newTieredBidRuleBundle("code-154", "name-960");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBidRuleBundle moves to scheduled", () => {
  const item = newTieredBidRuleBundle("code-154", "name-960");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredBidRuleBundle rejects moves from cancelled", () => {
  const item = newTieredBidRuleBundle("code-154", "name-960");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
