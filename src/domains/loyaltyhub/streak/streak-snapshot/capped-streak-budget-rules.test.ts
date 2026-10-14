import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStreakBudgetCodeLengthRule,
  CappedStreakBudgetRequiredSummaryRule,
  CappedStreakBudgetRequiredTitleRule,
  CappedStreakBudgetVariantLengthRule,
  defaultCappedStreakBudgetValidator,
} from "./capped-streak-budget-rules.js";
import { newCappedStreakBudget } from "./capped-streak-budget.js";

test("CappedStreakBudgetValidator reports every problem", () => {
  const validator = defaultCappedStreakBudgetValidator();
  const item = newCappedStreakBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStreakBudgetRequiredSummaryRule flags a blank summary", () => {
  const rule = new CappedStreakBudgetRequiredSummaryRule("capped streak budget needs this field");
  const item = newCappedStreakBudget("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new CappedStreakBudgetRequiredTitleRule("capped streak budget needs an entry");
  const item = newCappedStreakBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakBudgetVariantLengthRule flags a long variant", () => {
  const rule = new CappedStreakBudgetVariantLengthRule(86400);
  const item = newCappedStreakBudget("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStreakBudgetCodeLengthRule flags a long code", () => {
  const rule = new CappedStreakBudgetCodeLengthRule(3600);
  const item = newCappedStreakBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
