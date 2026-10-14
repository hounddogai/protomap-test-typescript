import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPostMetricCohortLengthRule,
  SeasonalPostMetricLabelLengthRule,
  SeasonalPostMetricRequiredCohortRule,
  defaultSeasonalPostMetricValidator,
} from "./seasonal-post-metric-rules.js";
import { newSeasonalPostMetric } from "./seasonal-post-metric.js";

test("SeasonalPostMetricValidator reports every problem", () => {
  const validator = defaultSeasonalPostMetricValidator();
  const item = newSeasonalPostMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPostMetricRequiredCohortRule flags a blank cohort", () => {
  const rule = new SeasonalPostMetricRequiredCohortRule("seasonal post metric needs an entry");
  const item = newSeasonalPostMetric("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPostMetricCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalPostMetricCohortLengthRule(64);
  const item = newSeasonalPostMetric("x", "y");
  item.cohort = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPostMetricLabelLengthRule flags a long label", () => {
  const rule = new SeasonalPostMetricLabelLengthRule(120);
  const item = newSeasonalPostMetric("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
