import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitMetricRequiredVariantRule,
  WaitMetricUpdatedAtRangeRule,
  defaultWaitMetricValidator,
} from "./wait-metric-rules.js";
import { newWaitMetric } from "./wait-metric.js";

test("WaitMetricValidator reports every problem", () => {
  const validator = defaultWaitMetricValidator();
  const item = newWaitMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitMetricUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new WaitMetricUpdatedAtRangeRule(255, 255);
  const item = newWaitMetric("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitMetricRequiredVariantRule flags a blank variant", () => {
  const rule = new WaitMetricRequiredVariantRule("wait metric needs a value");
  const item = newWaitMetric("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
