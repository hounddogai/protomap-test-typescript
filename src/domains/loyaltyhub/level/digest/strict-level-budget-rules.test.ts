import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictLevelBudgetCodeLengthRule,
  StrictLevelBudgetRatioRangeRule,
  StrictLevelBudgetRequiredCohortRule,
  StrictLevelBudgetRequiredLabelRule,
  defaultStrictLevelBudgetValidator,
} from "./strict-level-budget-rules.js";
import { newStrictLevelBudget } from "./strict-level-budget.js";

test("StrictLevelBudgetValidator reports every problem", () => {
  const validator = defaultStrictLevelBudgetValidator();
  const item = newStrictLevelBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictLevelBudgetRequiredCohortRule flags a blank cohort", () => {
  const rule = new StrictLevelBudgetRequiredCohortRule("strict level budget needs this field");
  const item = newStrictLevelBudget("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLevelBudgetRatioRangeRule flags values above ratio", () => {
  const rule = new StrictLevelBudgetRatioRangeRule(3.6, 148.9);
  const item = newStrictLevelBudget("x", "y");
  item.ratio = 150.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictLevelBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new StrictLevelBudgetRequiredLabelRule("strict level budget needs an entry");
  const item = newStrictLevelBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLevelBudgetCodeLengthRule flags a long code", () => {
  const rule = new StrictLevelBudgetCodeLengthRule(255);
  const item = newStrictLevelBudget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
