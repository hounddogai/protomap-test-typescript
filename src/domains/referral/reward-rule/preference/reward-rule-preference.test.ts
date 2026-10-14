import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRulePreference } from "./reward-rule-preference.js";

test("RewardRulePreference starts in planned", () => {
  const item = newRewardRulePreference("code-841", "name-288");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRulePreference moves to scheduled", () => {
  const item = newRewardRulePreference("code-841", "name-288");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RewardRulePreference rejects moves from cancelled", () => {
  const item = newRewardRulePreference("code-841", "name-288");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
