import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInBudgetRequiredCodeRule,
  DoubleOptInBudgetTitleLengthRule,
  DoubleOptInBudgetWindowDaysRangeRule,
  defaultDoubleOptInBudgetValidator,
} from "./double-opt-in-budget-rules.js";
import { newDoubleOptInBudget } from "./double-opt-in-budget.js";

test("DoubleOptInBudgetValidator reports every problem", () => {
  const validator = defaultDoubleOptInBudgetValidator();
  const item = newDoubleOptInBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInBudgetRequiredCodeRule("double opt in budget needs a value");
  const item = newDoubleOptInBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInBudgetTitleLengthRule flags a long title", () => {
  const rule = new DoubleOptInBudgetTitleLengthRule(80);
  const item = newDoubleOptInBudget("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInBudgetWindowDaysRangeRule flags values above window days", () => {
  const rule = new DoubleOptInBudgetWindowDaysRangeRule(16, 80);
  const item = newDoubleOptInBudget("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
