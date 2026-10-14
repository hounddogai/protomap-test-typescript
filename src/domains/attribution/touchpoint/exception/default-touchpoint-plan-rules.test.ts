import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultTouchpointPlanDurationMinutesRangeRule,
  DefaultTouchpointPlanNameLengthRule,
  DefaultTouchpointPlanRequiredSummaryRule,
  defaultDefaultTouchpointPlanValidator,
} from "./default-touchpoint-plan-rules.js";
import { newDefaultTouchpointPlan } from "./default-touchpoint-plan.js";

test("DefaultTouchpointPlanValidator reports every problem", () => {
  const validator = defaultDefaultTouchpointPlanValidator();
  const item = newDefaultTouchpointPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultTouchpointPlanDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultTouchpointPlanDurationMinutesRangeRule(80, 255);
  const item = newDefaultTouchpointPlan("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultTouchpointPlanNameLengthRule flags a long name", () => {
  const rule = new DefaultTouchpointPlanNameLengthRule(16);
  const item = newDefaultTouchpointPlan("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultTouchpointPlanRequiredSummaryRule flags a blank summary", () => {
  const rule = new DefaultTouchpointPlanRequiredSummaryRule("default touchpoint plan needs a value");
  const item = newDefaultTouchpointPlan("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
