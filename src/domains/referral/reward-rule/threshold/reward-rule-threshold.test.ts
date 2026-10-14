import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleThreshold } from "./reward-rule-threshold.js";

test("RewardRuleThreshold starts in new", () => {
  const item = newRewardRuleThreshold("code-440", "label-295");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleThreshold moves to done", () => {
  const item = newRewardRuleThreshold("code-440", "label-295");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RewardRuleThreshold rejects moves from failed", () => {
  const item = newRewardRuleThreshold("code-440", "label-295");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
