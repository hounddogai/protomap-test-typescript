import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("WeightedRewardRulePreference starts in created", () => {
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardRulePreference moves to validated", () => {
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedRewardRulePreference rejects moves from retired", () => {
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
