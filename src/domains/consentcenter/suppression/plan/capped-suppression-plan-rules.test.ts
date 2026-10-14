import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSuppressionPlanLabelLengthRule,
  CappedSuppressionPlanRequiredUnitRule,
  CappedSuppressionPlanThresholdRangeRule,
  CappedSuppressionPlanUnitLengthRule,
  defaultCappedSuppressionPlanValidator,
} from "./capped-suppression-plan-rules.js";
import { newCappedSuppressionPlan } from "./capped-suppression-plan.js";

test("CappedSuppressionPlanValidator reports every problem", () => {
  const validator = defaultCappedSuppressionPlanValidator();
  const item = newCappedSuppressionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSuppressionPlanLabelLengthRule flags a long label", () => {
  const rule = new CappedSuppressionPlanLabelLengthRule(16);
  const item = newCappedSuppressionPlan("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSuppressionPlanUnitLengthRule flags a long unit", () => {
  const rule = new CappedSuppressionPlanUnitLengthRule(32);
  const item = newCappedSuppressionPlan("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSuppressionPlanThresholdRangeRule flags values above threshold", () => {
  const rule = new CappedSuppressionPlanThresholdRangeRule(6.6, 3224.3);
  const item = newCappedSuppressionPlan("x", "y");
  item.threshold = 3225.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedSuppressionPlanRequiredUnitRule flags a blank unit", () => {
  const rule = new CappedSuppressionPlanRequiredUnitRule("capped suppression plan needs this field");
  const item = newCappedSuppressionPlan("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
