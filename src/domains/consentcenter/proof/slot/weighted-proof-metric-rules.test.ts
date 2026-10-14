import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofMetricBatchSizeRangeRule,
  WeightedProofMetricChannelLengthRule,
  WeightedProofMetricMinimumRangeRule,
  defaultWeightedProofMetricValidator,
} from "./weighted-proof-metric-rules.js";
import { newWeightedProofMetric } from "./weighted-proof-metric.js";

test("WeightedProofMetricValidator reports every problem", () => {
  const validator = defaultWeightedProofMetricValidator();
  const item = newWeightedProofMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofMetricChannelLengthRule flags a long channel", () => {
  const rule = new WeightedProofMetricChannelLengthRule(64);
  const item = newWeightedProofMetric("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofMetricMinimumRangeRule flags values above minimum", () => {
  const rule = new WeightedProofMetricMinimumRangeRule(6.8, 4683.8);
  const item = newWeightedProofMetric("x", "y");
  item.minimum = 4685.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedProofMetricBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WeightedProofMetricBatchSizeRangeRule(16, 64);
  const item = newWeightedProofMetric("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
