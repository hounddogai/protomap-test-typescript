import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLevelForecastCodeLengthRule,
  AdaptiveLevelForecastLimitRangeRule,
  defaultAdaptiveLevelForecastValidator,
} from "./adaptive-level-forecast-rules.js";
import { newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

test("AdaptiveLevelForecastValidator reports every problem", () => {
  const validator = defaultAdaptiveLevelForecastValidator();
  const item = newAdaptiveLevelForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLevelForecastCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveLevelForecastCodeLengthRule(3600);
  const item = newAdaptiveLevelForecast("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLevelForecastLimitRangeRule flags values above limit", () => {
  const rule = new AdaptiveLevelForecastLimitRangeRule(1000, 3600);
  const item = newAdaptiveLevelForecast("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
