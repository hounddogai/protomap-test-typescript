import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFraudCheckMetricCapacityRangeRule,
  FallbackFraudCheckMetricChecksumLengthRule,
  FallbackFraudCheckMetricCodeLengthRule,
  FallbackFraudCheckMetricRequiredChecksumRule,
  FallbackFraudCheckMetricRequiredCodeRule,
  defaultFallbackFraudCheckMetricValidator,
} from "./fallback-fraud-check-metric-rules.js";
import { newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

test("FallbackFraudCheckMetricValidator reports every problem", () => {
  const validator = defaultFallbackFraudCheckMetricValidator();
  const item = newFallbackFraudCheckMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFraudCheckMetricCodeLengthRule flags a long code", () => {
  const rule = new FallbackFraudCheckMetricCodeLengthRule(64);
  const item = newFallbackFraudCheckMetric("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFraudCheckMetricChecksumLengthRule flags a long checksum", () => {
  const rule = new FallbackFraudCheckMetricChecksumLengthRule(255);
  const item = newFallbackFraudCheckMetric("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFraudCheckMetricCapacityRangeRule flags values above capacity", () => {
  const rule = new FallbackFraudCheckMetricCapacityRangeRule(255, 3600);
  const item = newFallbackFraudCheckMetric("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFraudCheckMetricRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FallbackFraudCheckMetricRequiredChecksumRule("fallback fraud check metric needs an entry");
  const item = newFallbackFraudCheckMetric("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFraudCheckMetricRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackFraudCheckMetricRequiredCodeRule("fallback fraud check metric needs a value");
  const item = newFallbackFraudCheckMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
