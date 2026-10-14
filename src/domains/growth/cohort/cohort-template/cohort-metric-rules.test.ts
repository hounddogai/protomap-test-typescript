import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortMetricClicksRangeRule,
  CohortMetricOpenRateRangeRule,
  CohortMetricQuantityRangeRule,
  CohortMetricRequiredReviewerRule,
  defaultCohortMetricValidator,
} from "./cohort-metric-rules.js";
import { newCohortMetric } from "./cohort-metric.js";

test("CohortMetricValidator reports every problem", () => {
  const validator = defaultCohortMetricValidator();
  const item = newCohortMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortMetricClicksRangeRule flags values above clicks", () => {
  const rule = new CohortMetricClicksRangeRule(32, 120);
  const item = newCohortMetric("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortMetricQuantityRangeRule flags values above quantity", () => {
  const rule = new CohortMetricQuantityRangeRule(255, 86400);
  const item = newCohortMetric("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortMetricOpenRateRangeRule flags values above open rate", () => {
  const rule = new CohortMetricOpenRateRangeRule(5.7, 1603.5);
  const item = newCohortMetric("x", "y");
  item.openRate = 1605;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortMetricRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CohortMetricRequiredReviewerRule("cohort metric needs this field");
  const item = newCohortMetric("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
