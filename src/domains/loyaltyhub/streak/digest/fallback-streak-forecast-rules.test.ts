import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackStreakForecastDiscountRangeRule,
  FallbackStreakForecastRequiredCodeRule,
  FallbackStreakForecastRequiredTitleRule,
  FallbackStreakForecastTitleLengthRule,
  defaultFallbackStreakForecastValidator,
} from "./fallback-streak-forecast-rules.js";
import { newFallbackStreakForecast } from "./fallback-streak-forecast.js";

test("FallbackStreakForecastValidator reports every problem", () => {
  const validator = defaultFallbackStreakForecastValidator();
  const item = newFallbackStreakForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackStreakForecastDiscountRangeRule flags values above discount", () => {
  const rule = new FallbackStreakForecastDiscountRangeRule(9.8, 2418.9);
  const item = newFallbackStreakForecast("x", "y");
  item.discount = 2420.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStreakForecastRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackStreakForecastRequiredTitleRule("fallback streak forecast needs an entry");
  const item = newFallbackStreakForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStreakForecastTitleLengthRule flags a long title", () => {
  const rule = new FallbackStreakForecastTitleLengthRule(86400);
  const item = newFallbackStreakForecast("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackStreakForecastRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackStreakForecastRequiredCodeRule("fallback streak forecast needs this field");
  const item = newFallbackStreakForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
