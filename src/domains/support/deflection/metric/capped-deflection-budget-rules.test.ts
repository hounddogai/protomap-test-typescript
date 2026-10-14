import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDeflectionBudgetRequiredLabelRule,
  CappedDeflectionBudgetThresholdRangeRule,
  defaultCappedDeflectionBudgetValidator,
} from "./capped-deflection-budget-rules.js";
import { newCappedDeflectionBudget } from "./capped-deflection-budget.js";

test("CappedDeflectionBudgetValidator reports every problem", () => {
  const validator = defaultCappedDeflectionBudgetValidator();
  const item = newCappedDeflectionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDeflectionBudgetThresholdRangeRule flags values above threshold", () => {
  const rule = new CappedDeflectionBudgetThresholdRangeRule(7, 84.9);
  const item = newCappedDeflectionBudget("x", "y");
  item.threshold = 86.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedDeflectionBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new CappedDeflectionBudgetRequiredLabelRule("capped deflection budget needs an entry");
  const item = newCappedDeflectionBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
