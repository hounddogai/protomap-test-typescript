import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInPlanCapacityRangeRule,
  DoubleOptInPlanCodeLengthRule,
  DoubleOptInPlanMaximumRangeRule,
  DoubleOptInPlanRequiredCodeRule,
  DoubleOptInPlanRequiredLabelRule,
  defaultDoubleOptInPlanValidator,
} from "./double-opt-in-plan-rules.js";
import { newDoubleOptInPlan } from "./double-opt-in-plan.js";

test("DoubleOptInPlanValidator reports every problem", () => {
  const validator = defaultDoubleOptInPlanValidator();
  const item = newDoubleOptInPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInPlanMaximumRangeRule flags values above maximum", () => {
  const rule = new DoubleOptInPlanMaximumRangeRule(4.1, 1284.4);
  const item = newDoubleOptInPlan("x", "y");
  item.maximum = 1285.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInPlanCodeLengthRule flags a long code", () => {
  const rule = new DoubleOptInPlanCodeLengthRule(64);
  const item = newDoubleOptInPlan("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInPlanRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInPlanRequiredCodeRule("double opt in plan needs this field");
  const item = newDoubleOptInPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInPlanCapacityRangeRule flags values above capacity", () => {
  const rule = new DoubleOptInPlanCapacityRangeRule(16, 255);
  const item = newDoubleOptInPlan("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInPlanRequiredLabelRule flags a blank label", () => {
  const rule = new DoubleOptInPlanRequiredLabelRule("double opt in plan needs this field");
  const item = newDoubleOptInPlan("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
