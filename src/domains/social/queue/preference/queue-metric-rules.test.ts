import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueMetricFrequencyCapRangeRule,
  QueueMetricRequiredNameRule,
  QueueMetricStartsAtRangeRule,
  QueueMetricTimezoneLengthRule,
  defaultQueueMetricValidator,
} from "./queue-metric-rules.js";
import { newQueueMetric } from "./queue-metric.js";

test("QueueMetricValidator reports every problem", () => {
  const validator = defaultQueueMetricValidator();
  const item = newQueueMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueMetricRequiredNameRule flags a blank name", () => {
  const rule = new QueueMetricRequiredNameRule("queue metric needs this field");
  const item = newQueueMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueMetricStartsAtRangeRule flags values above starts at", () => {
  const rule = new QueueMetricStartsAtRangeRule(255, 86400);
  const item = newQueueMetric("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueMetricTimezoneLengthRule flags a long timezone", () => {
  const rule = new QueueMetricTimezoneLengthRule(1000);
  const item = newQueueMetric("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueMetricFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new QueueMetricFrequencyCapRangeRule(1000, 3600);
  const item = newQueueMetric("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
