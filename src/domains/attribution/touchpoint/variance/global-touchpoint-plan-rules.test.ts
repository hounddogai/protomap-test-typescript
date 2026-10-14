import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalTouchpointPlanBatchSizeRangeRule,
  GlobalTouchpointPlanMinimumRangeRule,
  GlobalTouchpointPlanPriorityRangeRule,
  GlobalTouchpointPlanRequiredNameRule,
  defaultGlobalTouchpointPlanValidator,
} from "./global-touchpoint-plan-rules.js";
import { newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

test("GlobalTouchpointPlanValidator reports every problem", () => {
  const validator = defaultGlobalTouchpointPlanValidator();
  const item = newGlobalTouchpointPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalTouchpointPlanRequiredNameRule flags a blank name", () => {
  const rule = new GlobalTouchpointPlanRequiredNameRule("global touchpoint plan needs this field");
  const item = newGlobalTouchpointPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalTouchpointPlanMinimumRangeRule flags values above minimum", () => {
  const rule = new GlobalTouchpointPlanMinimumRangeRule(4.4, 4718.8);
  const item = newGlobalTouchpointPlan("x", "y");
  item.minimum = 4720.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalTouchpointPlanPriorityRangeRule flags values above priority", () => {
  const rule = new GlobalTouchpointPlanPriorityRangeRule(32, 120);
  const item = newGlobalTouchpointPlan("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalTouchpointPlanBatchSizeRangeRule flags values above batch size", () => {
  const rule = new GlobalTouchpointPlanBatchSizeRangeRule(64, 86400);
  const item = newGlobalTouchpointPlan("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
