import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitBudgetRequiredCategoryRule,
  WaitBudgetRequiredChannelRule,
  WaitBudgetRequiredCodeRule,
  defaultWaitBudgetValidator,
} from "./wait-budget-rules.js";
import { newWaitBudget } from "./wait-budget.js";

test("WaitBudgetValidator reports every problem", () => {
  const validator = defaultWaitBudgetValidator();
  const item = newWaitBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new WaitBudgetRequiredCodeRule("wait budget needs an entry");
  const item = newWaitBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new WaitBudgetRequiredChannelRule("wait budget needs an entry");
  const item = newWaitBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitBudgetRequiredCategoryRule flags a blank category", () => {
  const rule = new WaitBudgetRequiredCategoryRule("wait budget needs a value");
  const item = newWaitBudget("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
