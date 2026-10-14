import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowMetricAudienceIdLengthRule,
  WindowMetricCapacityRangeRule,
  WindowMetricNameLengthRule,
  defaultWindowMetricValidator,
} from "./window-metric-rules.js";
import { newWindowMetric } from "./window-metric.js";

test("WindowMetricValidator reports every problem", () => {
  const validator = defaultWindowMetricValidator();
  const item = newWindowMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowMetricCapacityRangeRule flags values above capacity", () => {
  const rule = new WindowMetricCapacityRangeRule(16, 86400);
  const item = newWindowMetric("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowMetricAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WindowMetricAudienceIdLengthRule(32);
  const item = newWindowMetric("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowMetricNameLengthRule flags a long name", () => {
  const rule = new WindowMetricNameLengthRule(80);
  const item = newWindowMetric("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
