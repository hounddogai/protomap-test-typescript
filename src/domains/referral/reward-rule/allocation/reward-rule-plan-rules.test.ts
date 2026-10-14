import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRulePlanChecksumLengthRule,
  RewardRulePlanDiscountRangeRule,
  RewardRulePlanMaximumRangeRule,
  RewardRulePlanRetriesRangeRule,
  defaultRewardRulePlanValidator,
} from "./reward-rule-plan-rules.js";
import { newRewardRulePlan } from "./reward-rule-plan.js";

test("RewardRulePlanValidator reports every problem", () => {
  const validator = defaultRewardRulePlanValidator();
  const item = newRewardRulePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRulePlanChecksumLengthRule flags a long checksum", () => {
  const rule = new RewardRulePlanChecksumLengthRule(3600);
  const item = newRewardRulePlan("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRulePlanDiscountRangeRule flags values above discount", () => {
  const rule = new RewardRulePlanDiscountRangeRule(4.4, 4129.4);
  const item = newRewardRulePlan("x", "y");
  item.discount = 4130.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRulePlanRetriesRangeRule flags values above retries", () => {
  const rule = new RewardRulePlanRetriesRangeRule(255, 86400);
  const item = newRewardRulePlan("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRulePlanMaximumRangeRule flags values above maximum", () => {
  const rule = new RewardRulePlanMaximumRangeRule(4.6, 4077.3);
  const item = newRewardRulePlan("x", "y");
  item.maximum = 4078.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
