import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWaitBudgetCodeLengthRule,
  GlobalWaitBudgetExternalRefLengthRule,
  GlobalWaitBudgetLabelLengthRule,
  GlobalWaitBudgetRequiredCodeRule,
  GlobalWaitBudgetRequiredExternalRefRule,
  defaultGlobalWaitBudgetValidator,
} from "./global-wait-budget-rules.js";
import { newGlobalWaitBudget } from "./global-wait-budget.js";

test("GlobalWaitBudgetValidator reports every problem", () => {
  const validator = defaultGlobalWaitBudgetValidator();
  const item = newGlobalWaitBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWaitBudgetLabelLengthRule flags a long label", () => {
  const rule = new GlobalWaitBudgetLabelLengthRule(64);
  const item = newGlobalWaitBudget("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWaitBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalWaitBudgetRequiredCodeRule("global wait budget needs this field");
  const item = newGlobalWaitBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalWaitBudgetCodeLengthRule flags a long code", () => {
  const rule = new GlobalWaitBudgetCodeLengthRule(1000);
  const item = newGlobalWaitBudget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWaitBudgetRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new GlobalWaitBudgetRequiredExternalRefRule("global wait budget needs an entry");
  const item = newGlobalWaitBudget("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalWaitBudgetExternalRefLengthRule flags a long external ref", () => {
  const rule = new GlobalWaitBudgetExternalRefLengthRule(64);
  const item = newGlobalWaitBudget("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
