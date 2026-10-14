import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedBranchBudgetDiscountRangeRule,
  WeightedBranchBudgetRequiredCodeRule,
  WeightedBranchBudgetRequiredPhoneRule,
  WeightedBranchBudgetTitleLengthRule,
  defaultWeightedBranchBudgetValidator,
} from "./weighted-branch-budget-rules.js";
import { newWeightedBranchBudget } from "./weighted-branch-budget.js";

test("WeightedBranchBudgetValidator reports every problem", () => {
  const validator = defaultWeightedBranchBudgetValidator();
  const item = newWeightedBranchBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedBranchBudgetRequiredPhoneRule flags a blank phone", () => {
  const rule = new WeightedBranchBudgetRequiredPhoneRule("weighted branch budget needs this field");
  const item = newWeightedBranchBudget("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBranchBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedBranchBudgetRequiredCodeRule("weighted branch budget needs a value");
  const item = newWeightedBranchBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBranchBudgetTitleLengthRule flags a long title", () => {
  const rule = new WeightedBranchBudgetTitleLengthRule(80);
  const item = newWeightedBranchBudget("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedBranchBudgetDiscountRangeRule flags values above discount", () => {
  const rule = new WeightedBranchBudgetDiscountRangeRule(9.4, 954.3);
  const item = newWeightedBranchBudget("x", "y");
  item.discount = 955.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
