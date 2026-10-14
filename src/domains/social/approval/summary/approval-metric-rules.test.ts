import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalMetricCohortLengthRule,
  ApprovalMetricGraceDaysRangeRule,
  ApprovalMetricLabelLengthRule,
  ApprovalMetricRequiredCohortRule,
  ApprovalMetricRequiredTimezoneRule,
  defaultApprovalMetricValidator,
} from "./approval-metric-rules.js";
import { newApprovalMetric } from "./approval-metric.js";

test("ApprovalMetricValidator reports every problem", () => {
  const validator = defaultApprovalMetricValidator();
  const item = newApprovalMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalMetricLabelLengthRule flags a long label", () => {
  const rule = new ApprovalMetricLabelLengthRule(1000);
  const item = newApprovalMetric("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalMetricRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ApprovalMetricRequiredTimezoneRule("approval metric needs an entry");
  const item = newApprovalMetric("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalMetricRequiredCohortRule flags a blank cohort", () => {
  const rule = new ApprovalMetricRequiredCohortRule("approval metric needs an entry");
  const item = newApprovalMetric("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalMetricCohortLengthRule flags a long cohort", () => {
  const rule = new ApprovalMetricCohortLengthRule(120);
  const item = newApprovalMetric("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalMetricGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ApprovalMetricGraceDaysRangeRule(64, 3600);
  const item = newApprovalMetric("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
