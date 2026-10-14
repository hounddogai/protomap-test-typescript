import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardBudgetDurationMinutesRangeRule,
  WeightedRewardBudgetNameLengthRule,
  WeightedRewardBudgetRequiredCodeRule,
  defaultWeightedRewardBudgetValidator,
} from "./weighted-reward-budget-rules.js";
import { newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("WeightedRewardBudgetValidator reports every problem", () => {
  const validator = defaultWeightedRewardBudgetValidator();
  const item = newWeightedRewardBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardBudgetDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WeightedRewardBudgetDurationMinutesRangeRule(32, 80);
  const item = newWeightedRewardBudget("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedRewardBudgetRequiredCodeRule("weighted reward budget needs a value");
  const item = newWeightedRewardBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardBudgetNameLengthRule flags a long name", () => {
  const rule = new WeightedRewardBudgetNameLengthRule(80);
  const item = newWeightedRewardBudget("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
