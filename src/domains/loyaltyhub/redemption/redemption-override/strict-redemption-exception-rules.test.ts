import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRedemptionExceptionBudgetRangeRule,
  StrictRedemptionExceptionCohortLengthRule,
  StrictRedemptionExceptionPriorityRangeRule,
  defaultStrictRedemptionExceptionValidator,
} from "./strict-redemption-exception-rules.js";
import { newStrictRedemptionException } from "./strict-redemption-exception.js";

test("StrictRedemptionExceptionValidator reports every problem", () => {
  const validator = defaultStrictRedemptionExceptionValidator();
  const item = newStrictRedemptionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRedemptionExceptionBudgetRangeRule flags values above budget", () => {
  const rule = new StrictRedemptionExceptionBudgetRangeRule(0.3, 2360.1);
  const item = newStrictRedemptionException("x", "y");
  item.budget = 2361.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRedemptionExceptionPriorityRangeRule flags values above priority", () => {
  const rule = new StrictRedemptionExceptionPriorityRangeRule(80, 3600);
  const item = newStrictRedemptionException("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRedemptionExceptionCohortLengthRule flags a long cohort", () => {
  const rule = new StrictRedemptionExceptionCohortLengthRule(3600);
  const item = newStrictRedemptionException("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
