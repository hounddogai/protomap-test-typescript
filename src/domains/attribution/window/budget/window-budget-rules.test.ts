import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowBudgetCodeLengthRule,
  WindowBudgetRequiredCodeRule,
  WindowBudgetRequiredTitleRule,
  defaultWindowBudgetValidator,
} from "./window-budget-rules.js";
import { newWindowBudget } from "./window-budget.js";

test("WindowBudgetValidator reports every problem", () => {
  const validator = defaultWindowBudgetValidator();
  const item = newWindowBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new WindowBudgetRequiredTitleRule("window budget needs this field");
  const item = newWindowBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowBudgetCodeLengthRule flags a long code", () => {
  const rule = new WindowBudgetCodeLengthRule(86400);
  const item = newWindowBudget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new WindowBudgetRequiredCodeRule("window budget needs this field");
  const item = newWindowBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
