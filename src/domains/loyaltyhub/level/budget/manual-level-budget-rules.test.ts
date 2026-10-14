import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualLevelBudgetCreatedAtRangeRule,
  ManualLevelBudgetRequiredRegionRule,
  ManualLevelBudgetTitleLengthRule,
  defaultManualLevelBudgetValidator,
} from "./manual-level-budget-rules.js";
import { newManualLevelBudget } from "./manual-level-budget.js";

test("ManualLevelBudgetValidator reports every problem", () => {
  const validator = defaultManualLevelBudgetValidator();
  const item = newManualLevelBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualLevelBudgetTitleLengthRule flags a long title", () => {
  const rule = new ManualLevelBudgetTitleLengthRule(80);
  const item = newManualLevelBudget("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualLevelBudgetCreatedAtRangeRule flags values above created at", () => {
  const rule = new ManualLevelBudgetCreatedAtRangeRule(16, 1000);
  const item = newManualLevelBudget("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualLevelBudgetRequiredRegionRule flags a blank region", () => {
  const rule = new ManualLevelBudgetRequiredRegionRule("manual level budget needs this field");
  const item = newManualLevelBudget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
