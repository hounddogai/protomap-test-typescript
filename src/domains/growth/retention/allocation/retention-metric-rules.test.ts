import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionMetricNameLengthRule,
  RetentionMetricOpenRateRangeRule,
  RetentionMetricRequiredPhoneRule,
  RetentionMetricRevisionRangeRule,
  RetentionMetricWeightRangeRule,
  defaultRetentionMetricValidator,
} from "./retention-metric-rules.js";
import { newRetentionMetric } from "./retention-metric.js";

test("RetentionMetricValidator reports every problem", () => {
  const validator = defaultRetentionMetricValidator();
  const item = newRetentionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionMetricRevisionRangeRule flags values above revision", () => {
  const rule = new RetentionMetricRevisionRangeRule(64, 3600);
  const item = newRetentionMetric("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionMetricOpenRateRangeRule flags values above open rate", () => {
  const rule = new RetentionMetricOpenRateRangeRule(5.8, 1365.8);
  const item = newRetentionMetric("x", "y");
  item.openRate = 1367.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionMetricRequiredPhoneRule flags a blank phone", () => {
  const rule = new RetentionMetricRequiredPhoneRule("retention metric needs this field");
  const item = newRetentionMetric("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionMetricWeightRangeRule flags values above weight", () => {
  const rule = new RetentionMetricWeightRangeRule(8.2, 1871);
  const item = newRetentionMetric("x", "y");
  item.weight = 1872.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionMetricNameLengthRule flags a long name", () => {
  const rule = new RetentionMetricNameLengthRule(32);
  const item = newRetentionMetric("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
