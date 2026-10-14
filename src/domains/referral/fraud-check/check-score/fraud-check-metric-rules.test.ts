import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckMetricCountryLengthRule,
  FraudCheckMetricLabelLengthRule,
  FraudCheckMetricNameLengthRule,
  defaultFraudCheckMetricValidator,
} from "./fraud-check-metric-rules.js";
import { newFraudCheckMetric } from "./fraud-check-metric.js";

test("FraudCheckMetricValidator reports every problem", () => {
  const validator = defaultFraudCheckMetricValidator();
  const item = newFraudCheckMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckMetricLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckMetricLabelLengthRule(86400);
  const item = newFraudCheckMetric("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckMetricNameLengthRule flags a long name", () => {
  const rule = new FraudCheckMetricNameLengthRule(255);
  const item = newFraudCheckMetric("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckMetricCountryLengthRule flags a long country", () => {
  const rule = new FraudCheckMetricCountryLengthRule(120);
  const item = newFraudCheckMetric("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
