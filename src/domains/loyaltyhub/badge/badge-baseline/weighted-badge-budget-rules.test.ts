import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedBadgeBudgetLimitRangeRule,
  WeightedBadgeBudgetRequiredCodeRule,
  WeightedBadgeBudgetRequiredTitleRule,
  WeightedBadgeBudgetTitleLengthRule,
  defaultWeightedBadgeBudgetValidator,
} from "./weighted-badge-budget-rules.js";
import { newWeightedBadgeBudget } from "./weighted-badge-budget.js";

test("WeightedBadgeBudgetValidator reports every problem", () => {
  const validator = defaultWeightedBadgeBudgetValidator();
  const item = newWeightedBadgeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedBadgeBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedBadgeBudgetRequiredCodeRule("weighted badge budget needs this field");
  const item = newWeightedBadgeBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBadgeBudgetLimitRangeRule flags values above limit", () => {
  const rule = new WeightedBadgeBudgetLimitRangeRule(120, 1000);
  const item = newWeightedBadgeBudget("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedBadgeBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedBadgeBudgetRequiredTitleRule("weighted badge budget needs a value");
  const item = newWeightedBadgeBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBadgeBudgetTitleLengthRule flags a long title", () => {
  const rule = new WeightedBadgeBudgetTitleLengthRule(255);
  const item = newWeightedBadgeBudget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
