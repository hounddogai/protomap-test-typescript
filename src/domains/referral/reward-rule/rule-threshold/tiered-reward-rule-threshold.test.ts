import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

test("TieredRewardRuleThreshold starts in proposed", () => {
  const item = newTieredRewardRuleThreshold("code-399", "label-569");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardRuleThreshold moves to withdrawn", () => {
  const item = newTieredRewardRuleThreshold("code-399", "label-569");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("TieredRewardRuleThreshold rejects moves from withdrawn", () => {
  const item = newTieredRewardRuleThreshold("code-399", "label-569");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
