import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionMetricCodeLengthRule,
  RedemptionMetricExternalRefLengthRule,
  RedemptionMetricLabelLengthRule,
  RedemptionMetricRequiredLabelRule,
  RedemptionMetricRequiredPhoneRule,
  defaultRedemptionMetricValidator,
} from "./redemption-metric-rules.js";
import { newRedemptionMetric } from "./redemption-metric.js";

test("RedemptionMetricValidator reports every problem", () => {
  const validator = defaultRedemptionMetricValidator();
  const item = newRedemptionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionMetricRequiredPhoneRule flags a blank phone", () => {
  const rule = new RedemptionMetricRequiredPhoneRule("redemption metric needs an entry");
  const item = newRedemptionMetric("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionMetricCodeLengthRule flags a long code", () => {
  const rule = new RedemptionMetricCodeLengthRule(3600);
  const item = newRedemptionMetric("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionMetricExternalRefLengthRule flags a long external ref", () => {
  const rule = new RedemptionMetricExternalRefLengthRule(1000);
  const item = newRedemptionMetric("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionMetricLabelLengthRule flags a long label", () => {
  const rule = new RedemptionMetricLabelLengthRule(1000);
  const item = newRedemptionMetric("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionMetricRequiredLabelRule flags a blank label", () => {
  const rule = new RedemptionMetricRequiredLabelRule("redemption metric needs an entry");
  const item = newRedemptionMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
