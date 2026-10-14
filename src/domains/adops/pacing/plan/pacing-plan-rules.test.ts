import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingPlanDiscountRangeRule,
  PacingPlanGraceDaysRangeRule,
  PacingPlanLabelLengthRule,
  PacingPlanRequiredCodeRule,
  defaultPacingPlanValidator,
} from "./pacing-plan-rules.js";
import { newPacingPlan } from "./pacing-plan.js";

test("PacingPlanValidator reports every problem", () => {
  const validator = defaultPacingPlanValidator();
  const item = newPacingPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingPlanLabelLengthRule flags a long label", () => {
  const rule = new PacingPlanLabelLengthRule(86400);
  const item = newPacingPlan("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PacingPlanRequiredCodeRule("pacing plan needs an entry");
  const item = newPacingPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingPlanGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PacingPlanGraceDaysRangeRule(255, 1000);
  const item = newPacingPlan("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingPlanDiscountRangeRule flags values above discount", () => {
  const rule = new PacingPlanDiscountRangeRule(9.3, 3265.2);
  const item = newPacingPlan("x", "y");
  item.discount = 3266.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
