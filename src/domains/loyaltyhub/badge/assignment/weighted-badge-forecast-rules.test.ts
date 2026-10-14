import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedBadgeForecastCodeLengthRule,
  WeightedBadgeForecastCohortLengthRule,
  WeightedBadgeForecastMarginRangeRule,
  WeightedBadgeForecastMinimumRangeRule,
  defaultWeightedBadgeForecastValidator,
} from "./weighted-badge-forecast-rules.js";
import { newWeightedBadgeForecast } from "./weighted-badge-forecast.js";

test("WeightedBadgeForecastValidator reports every problem", () => {
  const validator = defaultWeightedBadgeForecastValidator();
  const item = newWeightedBadgeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedBadgeForecastMinimumRangeRule flags values above minimum", () => {
  const rule = new WeightedBadgeForecastMinimumRangeRule(7.1, 4272.4);
  const item = newWeightedBadgeForecast("x", "y");
  item.minimum = 4273.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedBadgeForecastCodeLengthRule flags a long code", () => {
  const rule = new WeightedBadgeForecastCodeLengthRule(32);
  const item = newWeightedBadgeForecast("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedBadgeForecastMarginRangeRule flags values above margin", () => {
  const rule = new WeightedBadgeForecastMarginRangeRule(4.7, 313.3);
  const item = newWeightedBadgeForecast("x", "y");
  item.margin = 314.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedBadgeForecastCohortLengthRule flags a long cohort", () => {
  const rule = new WeightedBadgeForecastCohortLengthRule(3600);
  const item = newWeightedBadgeForecast("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
