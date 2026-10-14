import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSubscriptionMetricBudgetRangeRule,
  SeasonalSubscriptionMetricFloorValueRangeRule,
  SeasonalSubscriptionMetricNameLengthRule,
  SeasonalSubscriptionMetricRequiredLocaleRule,
  SeasonalSubscriptionMetricRequiredTimezoneRule,
  SeasonalSubscriptionMetricTimezoneLengthRule,
  defaultSeasonalSubscriptionMetricValidator,
} from "./seasonal-subscription-metric-rules.js";
import { newSeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

test("SeasonalSubscriptionMetricValidator reports every problem", () => {
  const validator = defaultSeasonalSubscriptionMetricValidator();
  const item = newSeasonalSubscriptionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSubscriptionMetricBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalSubscriptionMetricBudgetRangeRule(2.6, 828.5);
  const item = newSeasonalSubscriptionMetric("x", "y");
  item.budget = 830;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSubscriptionMetricFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalSubscriptionMetricFloorValueRangeRule(4.3, 4505.8);
  const item = newSeasonalSubscriptionMetric("x", "y");
  item.floorValue = 4507.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSubscriptionMetricTimezoneLengthRule flags a long timezone", () => {
  const rule = new SeasonalSubscriptionMetricTimezoneLengthRule(120);
  const item = newSeasonalSubscriptionMetric("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSubscriptionMetricRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalSubscriptionMetricRequiredLocaleRule("seasonal subscription metric needs this field");
  const item = newSeasonalSubscriptionMetric("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSubscriptionMetricNameLengthRule flags a long name", () => {
  const rule = new SeasonalSubscriptionMetricNameLengthRule(3600);
  const item = newSeasonalSubscriptionMetric("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSubscriptionMetricRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SeasonalSubscriptionMetricRequiredTimezoneRule("seasonal subscription metric needs a value");
  const item = newSeasonalSubscriptionMetric("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
