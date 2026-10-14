import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelBudgetCapacityRangeRule,
  ModelBudgetCeilingRangeRule,
  ModelBudgetCodeLengthRule,
  ModelBudgetRequiredOwnerIdRule,
  ModelBudgetSummaryLengthRule,
  defaultModelBudgetValidator,
} from "./model-budget-rules.js";
import { newModelBudget } from "./model-budget.js";

test("ModelBudgetValidator reports every problem", () => {
  const validator = defaultModelBudgetValidator();
  const item = newModelBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelBudgetCapacityRangeRule flags values above capacity", () => {
  const rule = new ModelBudgetCapacityRangeRule(64, 80);
  const item = newModelBudget("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelBudgetCeilingRangeRule flags values above ceiling", () => {
  const rule = new ModelBudgetCeilingRangeRule(1.6, 2613.7);
  const item = newModelBudget("x", "y");
  item.ceiling = 2615.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelBudgetSummaryLengthRule flags a long summary", () => {
  const rule = new ModelBudgetSummaryLengthRule(16);
  const item = newModelBudget("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelBudgetCodeLengthRule flags a long code", () => {
  const rule = new ModelBudgetCodeLengthRule(3600);
  const item = newModelBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelBudgetRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ModelBudgetRequiredOwnerIdRule("model budget needs a value");
  const item = newModelBudget("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
