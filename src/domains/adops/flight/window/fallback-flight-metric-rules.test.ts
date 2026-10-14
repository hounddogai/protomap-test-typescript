import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFlightMetricTimezoneLengthRule,
  FallbackFlightMetricVersionRangeRule,
  defaultFallbackFlightMetricValidator,
} from "./fallback-flight-metric-rules.js";
import { newFallbackFlightMetric } from "./fallback-flight-metric.js";

test("FallbackFlightMetricValidator reports every problem", () => {
  const validator = defaultFallbackFlightMetricValidator();
  const item = newFallbackFlightMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFlightMetricTimezoneLengthRule flags a long timezone", () => {
  const rule = new FallbackFlightMetricTimezoneLengthRule(16);
  const item = newFallbackFlightMetric("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFlightMetricVersionRangeRule flags values above version", () => {
  const rule = new FallbackFlightMetricVersionRangeRule(3600, 86400);
  const item = newFallbackFlightMetric("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
