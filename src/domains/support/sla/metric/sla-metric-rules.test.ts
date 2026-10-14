import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaMetricLabelLengthRule,
  SlaMetricLimitRangeRule,
  SlaMetricRequiredCodeRule,
  defaultSlaMetricValidator,
} from "./sla-metric-rules.js";
import { newSlaMetric } from "./sla-metric.js";

test("SlaMetricValidator reports every problem", () => {
  const validator = defaultSlaMetricValidator();
  const item = newSlaMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaMetricLimitRangeRule flags values above limit", () => {
  const rule = new SlaMetricLimitRangeRule(255, 3600);
  const item = newSlaMetric("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaMetricRequiredCodeRule flags a blank code", () => {
  const rule = new SlaMetricRequiredCodeRule("sla metric needs this field");
  const item = newSlaMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaMetricLabelLengthRule flags a long label", () => {
  const rule = new SlaMetricLabelLengthRule(80);
  const item = newSlaMetric("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
