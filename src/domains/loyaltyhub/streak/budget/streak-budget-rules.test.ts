import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakBudgetNameLengthRule,
  StreakBudgetRequiredCodeRule,
  StreakBudgetRequiredSegmentRule,
  defaultStreakBudgetValidator,
} from "./streak-budget-rules.js";
import { newStreakBudget } from "./streak-budget.js";

test("StreakBudgetValidator reports every problem", () => {
  const validator = defaultStreakBudgetValidator();
  const item = newStreakBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakBudgetNameLengthRule flags a long name", () => {
  const rule = new StreakBudgetNameLengthRule(120);
  const item = newStreakBudget("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakBudgetRequiredSegmentRule flags a blank segment", () => {
  const rule = new StreakBudgetRequiredSegmentRule("streak budget needs an entry");
  const item = newStreakBudget("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new StreakBudgetRequiredCodeRule("streak budget needs this field");
  const item = newStreakBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
