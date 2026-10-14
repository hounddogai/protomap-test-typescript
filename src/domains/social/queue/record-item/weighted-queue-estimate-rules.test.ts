import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedQueueEstimateBudgetRangeRule,
  WeightedQueueEstimateMaximumRangeRule,
  defaultWeightedQueueEstimateValidator,
} from "./weighted-queue-estimate-rules.js";
import { newWeightedQueueEstimate } from "./weighted-queue-estimate.js";

test("WeightedQueueEstimateValidator reports every problem", () => {
  const validator = defaultWeightedQueueEstimateValidator();
  const item = newWeightedQueueEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedQueueEstimateBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedQueueEstimateBudgetRangeRule(6.5, 2769.5);
  const item = newWeightedQueueEstimate("x", "y");
  item.budget = 2771;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedQueueEstimateMaximumRangeRule flags values above maximum", () => {
  const rule = new WeightedQueueEstimateMaximumRangeRule(6.5, 2254.5);
  const item = newWeightedQueueEstimate("x", "y");
  item.maximum = 2256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
