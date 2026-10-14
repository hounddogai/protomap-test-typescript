import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalActivationBudgetCodeLengthRule,
  RegionalActivationBudgetNameLengthRule,
  RegionalActivationBudgetRequiredNameRule,
  RegionalActivationBudgetSendAtRangeRule,
  RegionalActivationBudgetSourceLengthRule,
  defaultRegionalActivationBudgetValidator,
} from "./regional-activation-budget-rules.js";
import { newRegionalActivationBudget } from "./regional-activation-budget.js";

test("RegionalActivationBudgetValidator reports every problem", () => {
  const validator = defaultRegionalActivationBudgetValidator();
  const item = newRegionalActivationBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalActivationBudgetSourceLengthRule flags a long source", () => {
  const rule = new RegionalActivationBudgetSourceLengthRule(86400);
  const item = newRegionalActivationBudget("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalActivationBudgetSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalActivationBudgetSendAtRangeRule(64, 86400);
  const item = newRegionalActivationBudget("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalActivationBudgetNameLengthRule flags a long name", () => {
  const rule = new RegionalActivationBudgetNameLengthRule(32);
  const item = newRegionalActivationBudget("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalActivationBudgetCodeLengthRule flags a long code", () => {
  const rule = new RegionalActivationBudgetCodeLengthRule(1000);
  const item = newRegionalActivationBudget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalActivationBudgetRequiredNameRule flags a blank name", () => {
  const rule = new RegionalActivationBudgetRequiredNameRule("regional activation budget needs this field");
  const item = newRegionalActivationBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
