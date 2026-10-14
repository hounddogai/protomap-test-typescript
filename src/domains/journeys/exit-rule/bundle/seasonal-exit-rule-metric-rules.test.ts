import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalExitRuleMetricCohortLengthRule,
  SeasonalExitRuleMetricCountryLengthRule,
  SeasonalExitRuleMetricRequiredLabelRule,
  SeasonalExitRuleMetricRevisionRangeRule,
  defaultSeasonalExitRuleMetricValidator,
} from "./seasonal-exit-rule-metric-rules.js";
import { newSeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

test("SeasonalExitRuleMetricValidator reports every problem", () => {
  const validator = defaultSeasonalExitRuleMetricValidator();
  const item = newSeasonalExitRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalExitRuleMetricRevisionRangeRule flags values above revision", () => {
  const rule = new SeasonalExitRuleMetricRevisionRangeRule(16, 3600);
  const item = newSeasonalExitRuleMetric("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalExitRuleMetricCountryLengthRule flags a long country", () => {
  const rule = new SeasonalExitRuleMetricCountryLengthRule(16);
  const item = newSeasonalExitRuleMetric("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalExitRuleMetricCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalExitRuleMetricCohortLengthRule(86400);
  const item = newSeasonalExitRuleMetric("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalExitRuleMetricRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalExitRuleMetricRequiredLabelRule("seasonal exit rule metric needs an entry");
  const item = newSeasonalExitRuleMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
