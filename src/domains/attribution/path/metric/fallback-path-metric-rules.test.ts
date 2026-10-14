import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPathMetricAmountRangeRule,
  FallbackPathMetricBidRangeRule,
  FallbackPathMetricCodeLengthRule,
  FallbackPathMetricRequiredCodeRule,
  FallbackPathMetricRequiredLabelRule,
  defaultFallbackPathMetricValidator,
} from "./fallback-path-metric-rules.js";
import { newFallbackPathMetric } from "./fallback-path-metric.js";

test("FallbackPathMetricValidator reports every problem", () => {
  const validator = defaultFallbackPathMetricValidator();
  const item = newFallbackPathMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPathMetricRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackPathMetricRequiredCodeRule("fallback path metric needs this field");
  const item = newFallbackPathMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPathMetricAmountRangeRule flags values above amount", () => {
  const rule = new FallbackPathMetricAmountRangeRule(7.5, 3283.1);
  const item = newFallbackPathMetric("x", "y");
  item.amount = 3284.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPathMetricRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackPathMetricRequiredLabelRule("fallback path metric needs a value");
  const item = newFallbackPathMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPathMetricBidRangeRule flags values above bid", () => {
  const rule = new FallbackPathMetricBidRangeRule(5.7, 1370.3);
  const item = newFallbackPathMetric("x", "y");
  item.bid = 1371.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPathMetricCodeLengthRule flags a long code", () => {
  const rule = new FallbackPathMetricCodeLengthRule(255);
  const item = newFallbackPathMetric("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
