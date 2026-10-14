import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionMetricLabelLengthRule,
  ScheduledDeflectionMetricRatioRangeRule,
  ScheduledDeflectionMetricRequiredLabelRule,
  defaultScheduledDeflectionMetricValidator,
} from "./scheduled-deflection-metric-rules.js";
import { newScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

test("ScheduledDeflectionMetricValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionMetricValidator();
  const item = newScheduledDeflectionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionMetricRatioRangeRule flags values above ratio", () => {
  const rule = new ScheduledDeflectionMetricRatioRangeRule(5.7, 1804.6);
  const item = newScheduledDeflectionMetric("x", "y");
  item.ratio = 1806.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDeflectionMetricLabelLengthRule flags a long label", () => {
  const rule = new ScheduledDeflectionMetricLabelLengthRule(32);
  const item = newScheduledDeflectionMetric("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionMetricRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledDeflectionMetricRequiredLabelRule("scheduled deflection metric needs a value");
  const item = newScheduledDeflectionMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
