import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTierMetricJourneyIdLengthRule,
  PrimaryTierMetricNameLengthRule,
  PrimaryTierMetricPriorityRangeRule,
  PrimaryTierMetricRequiredNameRule,
  PrimaryTierMetricRevisionRangeRule,
  defaultPrimaryTierMetricValidator,
} from "./primary-tier-metric-rules.js";
import { newPrimaryTierMetric } from "./primary-tier-metric.js";

test("PrimaryTierMetricValidator reports every problem", () => {
  const validator = defaultPrimaryTierMetricValidator();
  const item = newPrimaryTierMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTierMetricRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryTierMetricRevisionRangeRule(120, 86400);
  const item = newPrimaryTierMetric("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryTierMetricPriorityRangeRule flags values above priority", () => {
  const rule = new PrimaryTierMetricPriorityRangeRule(32, 1000);
  const item = newPrimaryTierMetric("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryTierMetricJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PrimaryTierMetricJourneyIdLengthRule(255);
  const item = newPrimaryTierMetric("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTierMetricNameLengthRule flags a long name", () => {
  const rule = new PrimaryTierMetricNameLengthRule(64);
  const item = newPrimaryTierMetric("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryTierMetricRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryTierMetricRequiredNameRule("primary tier metric needs this field");
  const item = newPrimaryTierMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
