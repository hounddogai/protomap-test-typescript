import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRulePolicy } from "./reward-rule-policy.js";

test("RewardRulePolicy starts in planned", () => {
  const item = newRewardRulePolicy("code-920", "label-761");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRulePolicy moves to in progress", () => {
  const item = newRewardRulePolicy("code-920", "label-761");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RewardRulePolicy rejects moves from cancelled", () => {
  const item = newRewardRulePolicy("code-920", "label-761");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
