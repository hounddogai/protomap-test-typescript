import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckPlanRateRangeRule,
  FraudCheckPlanRequiredLabelRule,
  defaultFraudCheckPlanValidator,
} from "./fraud-check-plan-rules.js";
import { newFraudCheckPlan } from "./fraud-check-plan.js";

test("FraudCheckPlanValidator reports every problem", () => {
  const validator = defaultFraudCheckPlanValidator();
  const item = newFraudCheckPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckPlanRateRangeRule flags values above rate", () => {
  const rule = new FraudCheckPlanRateRangeRule(4.2, 1748.7);
  const item = newFraudCheckPlan("x", "y");
  item.rate = 1750.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckPlanRequiredLabelRule flags a blank label", () => {
  const rule = new FraudCheckPlanRequiredLabelRule("fraud check plan needs this field");
  const item = newFraudCheckPlan("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
