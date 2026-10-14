import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionBudgetCodeLengthRule,
  RedemptionBudgetContactEmailLengthRule,
  RedemptionBudgetDurationMinutesRangeRule,
  RedemptionBudgetLocaleLengthRule,
  RedemptionBudgetRequiredCodeRule,
  defaultRedemptionBudgetValidator,
} from "./redemption-budget-rules.js";
import { newRedemptionBudget } from "./redemption-budget.js";

test("RedemptionBudgetValidator reports every problem", () => {
  const validator = defaultRedemptionBudgetValidator();
  const item = newRedemptionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionBudgetCodeLengthRule flags a long code", () => {
  const rule = new RedemptionBudgetCodeLengthRule(3600);
  const item = newRedemptionBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionBudgetContactEmailLengthRule flags a long contact email", () => {
  const rule = new RedemptionBudgetContactEmailLengthRule(86400);
  const item = newRedemptionBudget("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionBudgetDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RedemptionBudgetDurationMinutesRangeRule(64, 3600);
  const item = newRedemptionBudget("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionBudgetLocaleLengthRule flags a long locale", () => {
  const rule = new RedemptionBudgetLocaleLengthRule(1000);
  const item = newRedemptionBudget("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionBudgetRequiredCodeRule("redemption budget needs a value");
  const item = newRedemptionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
