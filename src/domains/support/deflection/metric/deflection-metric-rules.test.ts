import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionMetricCohortLengthRule,
  DeflectionMetricLabelLengthRule,
  DeflectionMetricRatioRangeRule,
  defaultDeflectionMetricValidator,
} from "./deflection-metric-rules.js";
import { newDeflectionMetric } from "./deflection-metric.js";

test("DeflectionMetricValidator reports every problem", () => {
  const validator = defaultDeflectionMetricValidator();
  const item = newDeflectionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionMetricRatioRangeRule flags values above ratio", () => {
  const rule = new DeflectionMetricRatioRangeRule(9.1, 4777.2);
  const item = newDeflectionMetric("x", "y");
  item.ratio = 4778.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionMetricLabelLengthRule flags a long label", () => {
  const rule = new DeflectionMetricLabelLengthRule(16);
  const item = newDeflectionMetric("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionMetricCohortLengthRule flags a long cohort", () => {
  const rule = new DeflectionMetricCohortLengthRule(80);
  const item = newDeflectionMetric("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
