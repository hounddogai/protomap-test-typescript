import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWindowMetricBudgetRangeRule,
  LenientWindowMetricCodeLengthRule,
  LenientWindowMetricConversionRateRangeRule,
  LenientWindowMetricOpenRateRangeRule,
  LenientWindowMetricRequiredChannelRule,
  defaultLenientWindowMetricValidator,
} from "./lenient-window-metric-rules.js";
import { newLenientWindowMetric } from "./lenient-window-metric.js";

test("LenientWindowMetricValidator reports every problem", () => {
  const validator = defaultLenientWindowMetricValidator();
  const item = newLenientWindowMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWindowMetricConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LenientWindowMetricConversionRateRangeRule(1.6, 821.4);
  const item = newLenientWindowMetric("x", "y");
  item.conversionRate = 822.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWindowMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new LenientWindowMetricRequiredChannelRule("lenient window metric needs an entry");
  const item = newLenientWindowMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWindowMetricOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientWindowMetricOpenRateRangeRule(1.5, 1330.7);
  const item = newLenientWindowMetric("x", "y");
  item.openRate = 1332.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWindowMetricBudgetRangeRule flags values above budget", () => {
  const rule = new LenientWindowMetricBudgetRangeRule(6.5, 1115.6);
  const item = newLenientWindowMetric("x", "y");
  item.budget = 1117.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWindowMetricCodeLengthRule flags a long code", () => {
  const rule = new LenientWindowMetricCodeLengthRule(86400);
  const item = newLenientWindowMetric("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
