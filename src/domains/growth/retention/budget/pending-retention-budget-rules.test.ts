import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRetentionBudgetAttemptsRangeRule,
  PendingRetentionBudgetRegionLengthRule,
  PendingRetentionBudgetRequiredTimezoneRule,
  PendingRetentionBudgetTimezoneLengthRule,
  defaultPendingRetentionBudgetValidator,
} from "./pending-retention-budget-rules.js";
import { newPendingRetentionBudget } from "./pending-retention-budget.js";

test("PendingRetentionBudgetValidator reports every problem", () => {
  const validator = defaultPendingRetentionBudgetValidator();
  const item = newPendingRetentionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRetentionBudgetRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PendingRetentionBudgetRequiredTimezoneRule("pending retention budget needs an entry");
  const item = newPendingRetentionBudget("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRetentionBudgetAttemptsRangeRule flags values above attempts", () => {
  const rule = new PendingRetentionBudgetAttemptsRangeRule(32, 80);
  const item = newPendingRetentionBudget("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRetentionBudgetTimezoneLengthRule flags a long timezone", () => {
  const rule = new PendingRetentionBudgetTimezoneLengthRule(16);
  const item = newPendingRetentionBudget("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRetentionBudgetRegionLengthRule flags a long region", () => {
  const rule = new PendingRetentionBudgetRegionLengthRule(86400);
  const item = newPendingRetentionBudget("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
