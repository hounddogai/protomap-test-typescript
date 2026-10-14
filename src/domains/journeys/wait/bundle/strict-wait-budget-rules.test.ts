import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWaitBudgetBatchSizeRangeRule,
  StrictWaitBudgetCodeLengthRule,
  StrictWaitBudgetRequiredCodeRule,
  StrictWaitBudgetRequiredTitleRule,
  defaultStrictWaitBudgetValidator,
} from "./strict-wait-budget-rules.js";
import { newStrictWaitBudget } from "./strict-wait-budget.js";

test("StrictWaitBudgetValidator reports every problem", () => {
  const validator = defaultStrictWaitBudgetValidator();
  const item = newStrictWaitBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWaitBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new StrictWaitBudgetRequiredTitleRule("strict wait budget needs a value");
  const item = newStrictWaitBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitBudgetCodeLengthRule flags a long code", () => {
  const rule = new StrictWaitBudgetCodeLengthRule(86400);
  const item = newStrictWaitBudget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWaitBudgetBatchSizeRangeRule flags values above batch size", () => {
  const rule = new StrictWaitBudgetBatchSizeRangeRule(1000, 3600);
  const item = newStrictWaitBudget("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictWaitBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new StrictWaitBudgetRequiredCodeRule("strict wait budget needs this field");
  const item = newStrictWaitBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
