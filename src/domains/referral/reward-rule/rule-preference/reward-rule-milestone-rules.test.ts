import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleMilestoneCurrencyLengthRule,
  RewardRuleMilestoneMinimumRangeRule,
  RewardRuleMilestoneRequiredCodeRule,
  RewardRuleMilestoneRequiredCurrencyRule,
  RewardRuleMilestoneTitleLengthRule,
  defaultRewardRuleMilestoneValidator,
} from "./reward-rule-milestone-rules.js";
import { newRewardRuleMilestone } from "./reward-rule-milestone.js";

test("RewardRuleMilestoneValidator reports every problem", () => {
  const validator = defaultRewardRuleMilestoneValidator();
  const item = newRewardRuleMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleMilestoneRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RewardRuleMilestoneRequiredCurrencyRule("reward rule milestone needs this field");
  const item = newRewardRuleMilestone("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleMilestoneTitleLengthRule flags a long title", () => {
  const rule = new RewardRuleMilestoneTitleLengthRule(80);
  const item = newRewardRuleMilestone("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleMilestoneCurrencyLengthRule flags a long currency", () => {
  const rule = new RewardRuleMilestoneCurrencyLengthRule(120);
  const item = newRewardRuleMilestone("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleMilestoneRequiredCodeRule("reward rule milestone needs this field");
  const item = newRewardRuleMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleMilestoneMinimumRangeRule flags values above minimum", () => {
  const rule = new RewardRuleMilestoneMinimumRangeRule(1.4, 2038.5);
  const item = newRewardRuleMilestone("x", "y");
  item.minimum = 2040;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
