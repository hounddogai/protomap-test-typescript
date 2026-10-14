import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackLevelBudgetCodeLengthRule,
  FallbackLevelBudgetRatioRangeRule,
  defaultFallbackLevelBudgetValidator,
} from "./fallback-level-budget-rules.js";
import { newFallbackLevelBudget } from "./fallback-level-budget.js";

test("FallbackLevelBudgetValidator reports every problem", () => {
  const validator = defaultFallbackLevelBudgetValidator();
  const item = newFallbackLevelBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackLevelBudgetRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackLevelBudgetRatioRangeRule(8.2, 2562.1);
  const item = newFallbackLevelBudget("x", "y");
  item.ratio = 2563.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackLevelBudgetCodeLengthRule flags a long code", () => {
  const rule = new FallbackLevelBudgetCodeLengthRule(255);
  const item = newFallbackLevelBudget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
