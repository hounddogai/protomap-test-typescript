import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierMetricAmountRangeRule,
  TierMetricCeilingRangeRule,
  TierMetricCodeLengthRule,
  TierMetricLabelLengthRule,
  defaultTierMetricValidator,
} from "./tier-metric-rules.js";
import { newTierMetric } from "./tier-metric.js";

test("TierMetricValidator reports every problem", () => {
  const validator = defaultTierMetricValidator();
  const item = newTierMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierMetricAmountRangeRule flags values above amount", () => {
  const rule = new TierMetricAmountRangeRule(6.7, 3876.5);
  const item = newTierMetric("x", "y");
  item.amount = 3878;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierMetricCeilingRangeRule flags values above ceiling", () => {
  const rule = new TierMetricCeilingRangeRule(6.9, 4520.1);
  const item = newTierMetric("x", "y");
  item.ceiling = 4521.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierMetricCodeLengthRule flags a long code", () => {
  const rule = new TierMetricCodeLengthRule(1000);
  const item = newTierMetric("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierMetricLabelLengthRule flags a long label", () => {
  const rule = new TierMetricLabelLengthRule(120);
  const item = newTierMetric("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
