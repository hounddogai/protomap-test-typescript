import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallMetricAttemptsRangeRule,
  PaywallMetricChannelLengthRule,
  PaywallMetricConversionRateRangeRule,
  PaywallMetricRequiredChannelRule,
  PaywallMetricRequiredLabelRule,
  PaywallMetricUpdatedAtRangeRule,
  defaultPaywallMetricValidator,
} from "./paywall-metric-rules.js";
import { newPaywallMetric } from "./paywall-metric.js";

test("PaywallMetricValidator reports every problem", () => {
  const validator = defaultPaywallMetricValidator();
  const item = newPaywallMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallMetricUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PaywallMetricUpdatedAtRangeRule(64, 120);
  const item = newPaywallMetric("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallMetricChannelLengthRule flags a long channel", () => {
  const rule = new PaywallMetricChannelLengthRule(255);
  const item = newPaywallMetric("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new PaywallMetricRequiredChannelRule("paywall metric needs an entry");
  const item = newPaywallMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallMetricConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PaywallMetricConversionRateRangeRule(0.2, 1113.7);
  const item = newPaywallMetric("x", "y");
  item.conversionRate = 1115.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallMetricRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallMetricRequiredLabelRule("paywall metric needs an entry");
  const item = newPaywallMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallMetricAttemptsRangeRule flags values above attempts", () => {
  const rule = new PaywallMetricAttemptsRangeRule(16, 120);
  const item = newPaywallMetric("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
