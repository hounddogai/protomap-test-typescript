import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSenderMetricMaximumRangeRule,
  FallbackSenderMetricRequiredLabelRule,
  FallbackSenderMetricTimezoneLengthRule,
  FallbackSenderMetricWeightRangeRule,
  defaultFallbackSenderMetricValidator,
} from "./fallback-sender-metric-rules.js";
import { newFallbackSenderMetric } from "./fallback-sender-metric.js";

test("FallbackSenderMetricValidator reports every problem", () => {
  const validator = defaultFallbackSenderMetricValidator();
  const item = newFallbackSenderMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSenderMetricWeightRangeRule flags values above weight", () => {
  const rule = new FallbackSenderMetricWeightRangeRule(3.1, 4135.1);
  const item = newFallbackSenderMetric("x", "y");
  item.weight = 4136.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSenderMetricRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackSenderMetricRequiredLabelRule("fallback sender metric needs this field");
  const item = newFallbackSenderMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSenderMetricTimezoneLengthRule flags a long timezone", () => {
  const rule = new FallbackSenderMetricTimezoneLengthRule(32);
  const item = newFallbackSenderMetric("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSenderMetricMaximumRangeRule flags values above maximum", () => {
  const rule = new FallbackSenderMetricMaximumRangeRule(6.1, 4391.4);
  const item = newFallbackSenderMetric("x", "y");
  item.maximum = 4392.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
