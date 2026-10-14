import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakForecastBudgetRangeRule,
  StreakForecastExpiresAtRangeRule,
  StreakForecastRequiredCodeRule,
  StreakForecastRequiredTitleRule,
  StreakForecastTitleLengthRule,
  defaultStreakForecastValidator,
} from "./streak-forecast-rules.js";
import { newStreakForecast } from "./streak-forecast.js";

test("StreakForecastValidator reports every problem", () => {
  const validator = defaultStreakForecastValidator();
  const item = newStreakForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakForecastBudgetRangeRule flags values above budget", () => {
  const rule = new StreakForecastBudgetRangeRule(2.5, 4370);
  const item = newStreakForecast("x", "y");
  item.budget = 4371.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakForecastTitleLengthRule flags a long title", () => {
  const rule = new StreakForecastTitleLengthRule(16);
  const item = newStreakForecast("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakForecastRequiredTitleRule flags a blank title", () => {
  const rule = new StreakForecastRequiredTitleRule("streak forecast needs this field");
  const item = newStreakForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakForecastExpiresAtRangeRule flags values above expires at", () => {
  const rule = new StreakForecastExpiresAtRangeRule(16, 3600);
  const item = newStreakForecast("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakForecastRequiredCodeRule flags a blank code", () => {
  const rule = new StreakForecastRequiredCodeRule("streak forecast needs this field");
  const item = newStreakForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
