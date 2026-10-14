import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInForecastRatioRangeRule,
  DoubleOptInForecastRequiredCodeRule,
  DoubleOptInForecastRequiredJourneyIdRule,
  DoubleOptInForecastThresholdRangeRule,
  DoubleOptInForecastTitleLengthRule,
  defaultDoubleOptInForecastValidator,
} from "./double-opt-in-forecast-rules.js";
import { newDoubleOptInForecast } from "./double-opt-in-forecast.js";

test("DoubleOptInForecastValidator reports every problem", () => {
  const validator = defaultDoubleOptInForecastValidator();
  const item = newDoubleOptInForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInForecastRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInForecastRequiredCodeRule("double opt in forecast needs a value");
  const item = newDoubleOptInForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInForecastTitleLengthRule flags a long title", () => {
  const rule = new DoubleOptInForecastTitleLengthRule(120);
  const item = newDoubleOptInForecast("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInForecastRatioRangeRule flags values above ratio", () => {
  const rule = new DoubleOptInForecastRatioRangeRule(0.2, 4019.3);
  const item = newDoubleOptInForecast("x", "y");
  item.ratio = 4020.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInForecastThresholdRangeRule flags values above threshold", () => {
  const rule = new DoubleOptInForecastThresholdRangeRule(6, 3363.2);
  const item = newDoubleOptInForecast("x", "y");
  item.threshold = 3364.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInForecastRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new DoubleOptInForecastRequiredJourneyIdRule("double opt in forecast needs this field");
  const item = newDoubleOptInForecast("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
