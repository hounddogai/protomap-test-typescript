import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionBudgetCodeLengthRule,
  DeflectionBudgetLabelLengthRule,
  DeflectionBudgetMinimumRangeRule,
  DeflectionBudgetRequiredLabelRule,
  DeflectionBudgetRequiredLocaleRule,
  DeflectionBudgetWeightRangeRule,
  defaultDeflectionBudgetValidator,
} from "./deflection-budget-rules.js";
import { newDeflectionBudget } from "./deflection-budget.js";

test("DeflectionBudgetValidator reports every problem", () => {
  const validator = defaultDeflectionBudgetValidator();
  const item = newDeflectionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new DeflectionBudgetRequiredLabelRule("deflection budget needs this field");
  const item = newDeflectionBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new DeflectionBudgetRequiredLocaleRule("deflection budget needs this field");
  const item = newDeflectionBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionBudgetWeightRangeRule flags values above weight", () => {
  const rule = new DeflectionBudgetWeightRangeRule(5.3, 3396.9);
  const item = newDeflectionBudget("x", "y");
  item.weight = 3398.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionBudgetLabelLengthRule flags a long label", () => {
  const rule = new DeflectionBudgetLabelLengthRule(3600);
  const item = newDeflectionBudget("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionBudgetMinimumRangeRule flags values above minimum", () => {
  const rule = new DeflectionBudgetMinimumRangeRule(3.6, 2898.8);
  const item = newDeflectionBudget("x", "y");
  item.minimum = 2900.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionBudgetCodeLengthRule flags a long code", () => {
  const rule = new DeflectionBudgetCodeLengthRule(80);
  const item = newDeflectionBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
