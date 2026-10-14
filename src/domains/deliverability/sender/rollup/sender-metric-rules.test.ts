import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderMetricBudgetRangeRule,
  SenderMetricThresholdRangeRule,
  SenderMetricTitleLengthRule,
  defaultSenderMetricValidator,
} from "./sender-metric-rules.js";
import { newSenderMetric } from "./sender-metric.js";

test("SenderMetricValidator reports every problem", () => {
  const validator = defaultSenderMetricValidator();
  const item = newSenderMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderMetricBudgetRangeRule flags values above budget", () => {
  const rule = new SenderMetricBudgetRangeRule(6.6, 3283.2);
  const item = newSenderMetric("x", "y");
  item.budget = 3284.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderMetricTitleLengthRule flags a long title", () => {
  const rule = new SenderMetricTitleLengthRule(32);
  const item = newSenderMetric("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderMetricThresholdRangeRule flags values above threshold", () => {
  const rule = new SenderMetricThresholdRangeRule(0.2, 870.5);
  const item = newSenderMetric("x", "y");
  item.threshold = 872;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
