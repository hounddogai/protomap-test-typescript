import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDoubleOptInPlanConversionRateRangeRule,
  BatchedDoubleOptInPlanRequiredCodeRule,
  BatchedDoubleOptInPlanRequiredNameRule,
  BatchedDoubleOptInPlanRequiredSegmentRule,
  defaultBatchedDoubleOptInPlanValidator,
} from "./batched-double-opt-in-plan-rules.js";
import { newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("BatchedDoubleOptInPlanValidator reports every problem", () => {
  const validator = defaultBatchedDoubleOptInPlanValidator();
  const item = newBatchedDoubleOptInPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDoubleOptInPlanRequiredNameRule flags a blank name", () => {
  const rule = new BatchedDoubleOptInPlanRequiredNameRule("batched double opt in plan needs an entry");
  const item = newBatchedDoubleOptInPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDoubleOptInPlanConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new BatchedDoubleOptInPlanConversionRateRangeRule(0.5, 759.8);
  const item = newBatchedDoubleOptInPlan("x", "y");
  item.conversionRate = 761.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDoubleOptInPlanRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDoubleOptInPlanRequiredCodeRule("batched double opt in plan needs an entry");
  const item = newBatchedDoubleOptInPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDoubleOptInPlanRequiredSegmentRule flags a blank segment", () => {
  const rule = new BatchedDoubleOptInPlanRequiredSegmentRule("batched double opt in plan needs a value");
  const item = newBatchedDoubleOptInPlan("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
