import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardForecastBudgetRangeRule,
  WeightedRewardForecastCodeLengthRule,
  WeightedRewardForecastCohortLengthRule,
  WeightedRewardForecastRatioRangeRule,
  WeightedRewardForecastRequiredOwnerIdRule,
  defaultWeightedRewardForecastValidator,
} from "./weighted-reward-forecast-rules.js";
import { newWeightedRewardForecast } from "./weighted-reward-forecast.js";

test("WeightedRewardForecastValidator reports every problem", () => {
  const validator = defaultWeightedRewardForecastValidator();
  const item = newWeightedRewardForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardForecastCodeLengthRule flags a long code", () => {
  const rule = new WeightedRewardForecastCodeLengthRule(3600);
  const item = newWeightedRewardForecast("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardForecastBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedRewardForecastBudgetRangeRule(4.5, 4881);
  const item = newWeightedRewardForecast("x", "y");
  item.budget = 4882.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardForecastCohortLengthRule flags a long cohort", () => {
  const rule = new WeightedRewardForecastCohortLengthRule(16);
  const item = newWeightedRewardForecast("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardForecastRatioRangeRule flags values above ratio", () => {
  const rule = new WeightedRewardForecastRatioRangeRule(7.7, 3642.6);
  const item = newWeightedRewardForecast("x", "y");
  item.ratio = 3644.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardForecastRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedRewardForecastRequiredOwnerIdRule("weighted reward forecast needs a value");
  const item = newWeightedRewardForecast("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
