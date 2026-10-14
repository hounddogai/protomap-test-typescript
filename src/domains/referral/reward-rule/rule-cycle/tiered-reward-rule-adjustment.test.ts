import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("TieredRewardRuleAdjustment starts in draft", () => {
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardRuleAdjustment moves to closed", () => {
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("TieredRewardRuleAdjustment rejects moves from closed", () => {
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
