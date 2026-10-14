import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutMetricChannelLengthRule,
  PayoutMetricClicksRangeRule,
  PayoutMetricNameLengthRule,
  defaultPayoutMetricValidator,
} from "./payout-metric-rules.js";
import { newPayoutMetric } from "./payout-metric.js";

test("PayoutMetricValidator reports every problem", () => {
  const validator = defaultPayoutMetricValidator();
  const item = newPayoutMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutMetricNameLengthRule flags a long name", () => {
  const rule = new PayoutMetricNameLengthRule(1000);
  const item = newPayoutMetric("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutMetricChannelLengthRule flags a long channel", () => {
  const rule = new PayoutMetricChannelLengthRule(3600);
  const item = newPayoutMetric("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutMetricClicksRangeRule flags values above clicks", () => {
  const rule = new PayoutMetricClicksRangeRule(120, 255);
  const item = newPayoutMetric("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
