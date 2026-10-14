import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleAllocation } from "./reward-rule-allocation.js";

test("RewardRuleAllocation starts in new", () => {
  const item = newRewardRuleAllocation("code-445", "label-266");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleAllocation moves to failed", () => {
  const item = newRewardRuleAllocation("code-445", "label-266");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RewardRuleAllocation rejects moves from failed", () => {
  const item = newRewardRuleAllocation("code-445", "label-266");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
