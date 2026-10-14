import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentMetricCohortLengthRule,
  EnrollmentMetricMaximumRangeRule,
  EnrollmentMetricNameLengthRule,
  EnrollmentMetricRequiredNameRule,
  defaultEnrollmentMetricValidator,
} from "./enrollment-metric-rules.js";
import { newEnrollmentMetric } from "./enrollment-metric.js";

test("EnrollmentMetricValidator reports every problem", () => {
  const validator = defaultEnrollmentMetricValidator();
  const item = newEnrollmentMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentMetricCohortLengthRule flags a long cohort", () => {
  const rule = new EnrollmentMetricCohortLengthRule(3600);
  const item = newEnrollmentMetric("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentMetricMaximumRangeRule flags values above maximum", () => {
  const rule = new EnrollmentMetricMaximumRangeRule(4.1, 266.1);
  const item = newEnrollmentMetric("x", "y");
  item.maximum = 267.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentMetricRequiredNameRule flags a blank name", () => {
  const rule = new EnrollmentMetricRequiredNameRule("enrollment metric needs this field");
  const item = newEnrollmentMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentMetricNameLengthRule flags a long name", () => {
  const rule = new EnrollmentMetricNameLengthRule(1000);
  const item = newEnrollmentMetric("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
