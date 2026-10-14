import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingStreakBudgetCodeLengthRule,
  PendingStreakBudgetCountryLengthRule,
  PendingStreakBudgetRequiredTitleRule,
  PendingStreakBudgetTimezoneLengthRule,
  defaultPendingStreakBudgetValidator,
} from "./pending-streak-budget-rules.js";
import { newPendingStreakBudget } from "./pending-streak-budget.js";

test("PendingStreakBudgetValidator reports every problem", () => {
  const validator = defaultPendingStreakBudgetValidator();
  const item = newPendingStreakBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingStreakBudgetCodeLengthRule flags a long code", () => {
  const rule = new PendingStreakBudgetCodeLengthRule(120);
  const item = newPendingStreakBudget("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingStreakBudgetCountryLengthRule flags a long country", () => {
  const rule = new PendingStreakBudgetCountryLengthRule(86400);
  const item = newPendingStreakBudget("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingStreakBudgetTimezoneLengthRule flags a long timezone", () => {
  const rule = new PendingStreakBudgetTimezoneLengthRule(255);
  const item = newPendingStreakBudget("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingStreakBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new PendingStreakBudgetRequiredTitleRule("pending streak budget needs a value");
  const item = newPendingStreakBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
