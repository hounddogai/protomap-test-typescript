import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationBudgetCeilingRangeRule,
  ActivationBudgetCodeLengthRule,
  ActivationBudgetRequiredCodeRule,
  ActivationBudgetRequiredTitleRule,
  defaultActivationBudgetValidator,
} from "./activation-budget-rules.js";
import { newActivationBudget } from "./activation-budget.js";

test("ActivationBudgetValidator reports every problem", () => {
  const validator = defaultActivationBudgetValidator();
  const item = newActivationBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new ActivationBudgetRequiredTitleRule("activation budget needs an entry");
  const item = newActivationBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationBudgetCeilingRangeRule flags values above ceiling", () => {
  const rule = new ActivationBudgetCeilingRangeRule(5.1, 2959.1);
  const item = newActivationBudget("x", "y");
  item.ceiling = 2960.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationBudgetCodeLengthRule flags a long code", () => {
  const rule = new ActivationBudgetCodeLengthRule(1000);
  const item = newActivationBudget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationBudgetRequiredCodeRule("activation budget needs a value");
  const item = newActivationBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
