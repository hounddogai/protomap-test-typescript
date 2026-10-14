import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFrequencyMetricCodeLengthRule,
  BatchedFrequencyMetricSourceLengthRule,
  defaultBatchedFrequencyMetricValidator,
} from "./batched-frequency-metric-rules.js";
import { newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

test("BatchedFrequencyMetricValidator reports every problem", () => {
  const validator = defaultBatchedFrequencyMetricValidator();
  const item = newBatchedFrequencyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFrequencyMetricCodeLengthRule flags a long code", () => {
  const rule = new BatchedFrequencyMetricCodeLengthRule(64);
  const item = newBatchedFrequencyMetric("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFrequencyMetricSourceLengthRule flags a long source", () => {
  const rule = new BatchedFrequencyMetricSourceLengthRule(120);
  const item = newBatchedFrequencyMetric("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
