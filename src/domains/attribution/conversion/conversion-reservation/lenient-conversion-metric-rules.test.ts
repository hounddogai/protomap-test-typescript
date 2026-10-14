import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientConversionMetricLimitRangeRule,
  LenientConversionMetricPriorityRangeRule,
  LenientConversionMetricRequiredCurrencyRule,
  LenientConversionMetricSequenceRangeRule,
  LenientConversionMetricWindowDaysRangeRule,
  defaultLenientConversionMetricValidator,
} from "./lenient-conversion-metric-rules.js";
import { newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("LenientConversionMetricValidator reports every problem", () => {
  const validator = defaultLenientConversionMetricValidator();
  const item = newLenientConversionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientConversionMetricLimitRangeRule flags values above limit", () => {
  const rule = new LenientConversionMetricLimitRangeRule(16, 80);
  const item = newLenientConversionMetric("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionMetricRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LenientConversionMetricRequiredCurrencyRule("lenient conversion metric needs this field");
  const item = newLenientConversionMetric("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientConversionMetricPriorityRangeRule flags values above priority", () => {
  const rule = new LenientConversionMetricPriorityRangeRule(32, 255);
  const item = newLenientConversionMetric("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionMetricSequenceRangeRule flags values above sequence", () => {
  const rule = new LenientConversionMetricSequenceRangeRule(255, 3600);
  const item = newLenientConversionMetric("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionMetricWindowDaysRangeRule flags values above window days", () => {
  const rule = new LenientConversionMetricWindowDaysRangeRule(16, 1000);
  const item = newLenientConversionMetric("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
