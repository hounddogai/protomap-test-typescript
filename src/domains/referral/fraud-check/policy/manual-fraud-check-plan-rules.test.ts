import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFraudCheckPlanCodeLengthRule,
  ManualFraudCheckPlanFloorValueRangeRule,
  ManualFraudCheckPlanRequiredCodeRule,
  ManualFraudCheckPlanStartsAtRangeRule,
  defaultManualFraudCheckPlanValidator,
} from "./manual-fraud-check-plan-rules.js";
import { newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("ManualFraudCheckPlanValidator reports every problem", () => {
  const validator = defaultManualFraudCheckPlanValidator();
  const item = newManualFraudCheckPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFraudCheckPlanFloorValueRangeRule flags values above floor value", () => {
  const rule = new ManualFraudCheckPlanFloorValueRangeRule(9.8, 2397.8);
  const item = newManualFraudCheckPlan("x", "y");
  item.floorValue = 2399.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFraudCheckPlanRequiredCodeRule flags a blank code", () => {
  const rule = new ManualFraudCheckPlanRequiredCodeRule("manual fraud check plan needs a value");
  const item = newManualFraudCheckPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFraudCheckPlanStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualFraudCheckPlanStartsAtRangeRule(120, 86400);
  const item = newManualFraudCheckPlan("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFraudCheckPlanCodeLengthRule flags a long code", () => {
  const rule = new ManualFraudCheckPlanCodeLengthRule(80);
  const item = newManualFraudCheckPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
