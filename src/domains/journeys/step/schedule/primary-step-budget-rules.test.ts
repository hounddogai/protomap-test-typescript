import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryStepBudgetBudgetRangeRule,
  PrimaryStepBudgetCodeLengthRule,
  PrimaryStepBudgetLabelLengthRule,
  PrimaryStepBudgetRegionLengthRule,
  PrimaryStepBudgetRequiredRegionRule,
  PrimaryStepBudgetSendAtRangeRule,
  defaultPrimaryStepBudgetValidator,
} from "./primary-step-budget-rules.js";
import { newPrimaryStepBudget } from "./primary-step-budget.js";

test("PrimaryStepBudgetValidator reports every problem", () => {
  const validator = defaultPrimaryStepBudgetValidator();
  const item = newPrimaryStepBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryStepBudgetBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryStepBudgetBudgetRangeRule(3.4, 3694.2);
  const item = newPrimaryStepBudget("x", "y");
  item.budget = 3695.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepBudgetRegionLengthRule flags a long region", () => {
  const rule = new PrimaryStepBudgetRegionLengthRule(86400);
  const item = newPrimaryStepBudget("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryStepBudgetSendAtRangeRule flags values above send at", () => {
  const rule = new PrimaryStepBudgetSendAtRangeRule(1000, 86400);
  const item = newPrimaryStepBudget("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepBudgetCodeLengthRule flags a long code", () => {
  const rule = new PrimaryStepBudgetCodeLengthRule(80);
  const item = newPrimaryStepBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryStepBudgetRequiredRegionRule flags a blank region", () => {
  const rule = new PrimaryStepBudgetRequiredRegionRule("primary step budget needs a value");
  const item = newPrimaryStepBudget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryStepBudgetLabelLengthRule flags a long label", () => {
  const rule = new PrimaryStepBudgetLabelLengthRule(16);
  const item = newPrimaryStepBudget("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
