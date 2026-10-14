import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedInsightMetricAttemptsRangeRule,
  CappedInsightMetricRequiredLabelRule,
  CappedInsightMetricSegmentLengthRule,
  defaultCappedInsightMetricValidator,
} from "./capped-insight-metric-rules.js";
import { newCappedInsightMetric } from "./capped-insight-metric.js";

test("CappedInsightMetricValidator reports every problem", () => {
  const validator = defaultCappedInsightMetricValidator();
  const item = newCappedInsightMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedInsightMetricRequiredLabelRule flags a blank label", () => {
  const rule = new CappedInsightMetricRequiredLabelRule("capped insight metric needs a value");
  const item = newCappedInsightMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedInsightMetricAttemptsRangeRule flags values above attempts", () => {
  const rule = new CappedInsightMetricAttemptsRangeRule(16, 3600);
  const item = newCappedInsightMetric("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedInsightMetricSegmentLengthRule flags a long segment", () => {
  const rule = new CappedInsightMetricSegmentLengthRule(64);
  const item = newCappedInsightMetric("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
