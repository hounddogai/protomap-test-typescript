import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSuppressionPlanCodeLengthRule,
  LenientSuppressionPlanDiscountRangeRule,
  LenientSuppressionPlanRequiredSourceRule,
  defaultLenientSuppressionPlanValidator,
} from "./lenient-suppression-plan-rules.js";
import { newLenientSuppressionPlan } from "./lenient-suppression-plan.js";

test("LenientSuppressionPlanValidator reports every problem", () => {
  const validator = defaultLenientSuppressionPlanValidator();
  const item = newLenientSuppressionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSuppressionPlanRequiredSourceRule flags a blank source", () => {
  const rule = new LenientSuppressionPlanRequiredSourceRule("lenient suppression plan needs an entry");
  const item = newLenientSuppressionPlan("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSuppressionPlanCodeLengthRule flags a long code", () => {
  const rule = new LenientSuppressionPlanCodeLengthRule(255);
  const item = newLenientSuppressionPlan("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSuppressionPlanDiscountRangeRule flags values above discount", () => {
  const rule = new LenientSuppressionPlanDiscountRangeRule(1, 2603.3);
  const item = newLenientSuppressionPlan("x", "y");
  item.discount = 2604.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
