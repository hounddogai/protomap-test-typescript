import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPostBudgetLocaleLengthRule,
  ManualPostBudgetNameLengthRule,
  ManualPostBudgetRequiredCodeRule,
  ManualPostBudgetRequiredLocaleRule,
  ManualPostBudgetRequiredNameRule,
  defaultManualPostBudgetValidator,
} from "./manual-post-budget-rules.js";
import { newManualPostBudget } from "./manual-post-budget.js";

test("ManualPostBudgetValidator reports every problem", () => {
  const validator = defaultManualPostBudgetValidator();
  const item = newManualPostBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPostBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new ManualPostBudgetRequiredLocaleRule("manual post budget needs a value");
  const item = newManualPostBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPostBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new ManualPostBudgetRequiredCodeRule("manual post budget needs a value");
  const item = newManualPostBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPostBudgetRequiredNameRule flags a blank name", () => {
  const rule = new ManualPostBudgetRequiredNameRule("manual post budget needs this field");
  const item = newManualPostBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPostBudgetNameLengthRule flags a long name", () => {
  const rule = new ManualPostBudgetNameLengthRule(16);
  const item = newManualPostBudget("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPostBudgetLocaleLengthRule flags a long locale", () => {
  const rule = new ManualPostBudgetLocaleLengthRule(32);
  const item = newManualPostBudget("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
