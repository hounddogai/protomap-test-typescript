import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRulePolicyFloorValueRangeRule,
  RewardRulePolicyRequiredCodeRule,
  RewardRulePolicyRequiredJourneyIdRule,
  RewardRulePolicyUpdatedAtRangeRule,
  defaultRewardRulePolicyValidator,
} from "./reward-rule-policy-rules.js";
import { newRewardRulePolicy } from "./reward-rule-policy.js";

test("RewardRulePolicyValidator reports every problem", () => {
  const validator = defaultRewardRulePolicyValidator();
  const item = newRewardRulePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRulePolicyRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RewardRulePolicyRequiredJourneyIdRule("reward rule policy needs this field");
  const item = newRewardRulePolicy("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRulePolicyUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RewardRulePolicyUpdatedAtRangeRule(32, 1000);
  const item = newRewardRulePolicy("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRulePolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new RewardRulePolicyFloorValueRangeRule(9.2, 213.9);
  const item = newRewardRulePolicy("x", "y");
  item.floorValue = 215.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRulePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRulePolicyRequiredCodeRule("reward rule policy needs a value");
  const item = newRewardRulePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
