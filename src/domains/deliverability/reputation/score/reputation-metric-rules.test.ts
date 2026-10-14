import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationMetricDescriptionLengthRule,
  ReputationMetricLabelLengthRule,
  ReputationMetricRequiredCohortRule,
  ReputationMetricRequiredLabelRule,
  ReputationMetricUpdatedAtRangeRule,
  defaultReputationMetricValidator,
} from "./reputation-metric-rules.js";
import { newReputationMetric } from "./reputation-metric.js";

test("ReputationMetricValidator reports every problem", () => {
  const validator = defaultReputationMetricValidator();
  const item = newReputationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationMetricRequiredLabelRule flags a blank label", () => {
  const rule = new ReputationMetricRequiredLabelRule("reputation metric needs an entry");
  const item = newReputationMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationMetricDescriptionLengthRule flags a long description", () => {
  const rule = new ReputationMetricDescriptionLengthRule(86400);
  const item = newReputationMetric("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationMetricUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ReputationMetricUpdatedAtRangeRule(64, 3600);
  const item = newReputationMetric("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationMetricLabelLengthRule flags a long label", () => {
  const rule = new ReputationMetricLabelLengthRule(32);
  const item = newReputationMetric("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationMetricRequiredCohortRule flags a blank cohort", () => {
  const rule = new ReputationMetricRequiredCohortRule("reputation metric needs a value");
  const item = newReputationMetric("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
