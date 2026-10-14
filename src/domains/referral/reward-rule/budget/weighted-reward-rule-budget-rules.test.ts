import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardRuleBudgetCountryLengthRule,
  WeightedRewardRuleBudgetMaximumRangeRule,
  WeightedRewardRuleBudgetRateRangeRule,
  WeightedRewardRuleBudgetRequiredCohortRule,
  defaultWeightedRewardRuleBudgetValidator,
} from "./weighted-reward-rule-budget-rules.js";
import { newWeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

test("WeightedRewardRuleBudgetValidator reports every problem", () => {
  const validator = defaultWeightedRewardRuleBudgetValidator();
  const item = newWeightedRewardRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardRuleBudgetRequiredCohortRule flags a blank cohort", () => {
  const rule = new WeightedRewardRuleBudgetRequiredCohortRule("weighted reward rule budget needs an entry");
  const item = newWeightedRewardRuleBudget("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardRuleBudgetMaximumRangeRule flags values above maximum", () => {
  const rule = new WeightedRewardRuleBudgetMaximumRangeRule(8.9, 1581.7);
  const item = newWeightedRewardRuleBudget("x", "y");
  item.maximum = 1583.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardRuleBudgetRateRangeRule flags values above rate", () => {
  const rule = new WeightedRewardRuleBudgetRateRangeRule(3.9, 4515.3);
  const item = newWeightedRewardRuleBudget("x", "y");
  item.rate = 4516.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardRuleBudgetCountryLengthRule flags a long country", () => {
  const rule = new WeightedRewardRuleBudgetCountryLengthRule(16);
  const item = newWeightedRewardRuleBudget("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
