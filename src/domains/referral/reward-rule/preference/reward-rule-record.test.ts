import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleRecord } from "./reward-rule-record.js";

test("RewardRuleRecord starts in planned", () => {
  const item = newRewardRuleRecord("code-1", "name-329");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleRecord moves to scheduled", () => {
  const item = newRewardRuleRecord("code-1", "name-329");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RewardRuleRecord rejects moves from cancelled", () => {
  const item = newRewardRuleRecord("code-1", "name-329");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
