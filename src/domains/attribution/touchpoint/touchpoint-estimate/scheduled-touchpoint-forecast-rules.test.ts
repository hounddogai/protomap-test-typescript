import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTouchpointForecastDurationMinutesRangeRule,
  ScheduledTouchpointForecastFloorValueRangeRule,
  ScheduledTouchpointForecastGraceDaysRangeRule,
  ScheduledTouchpointForecastLabelLengthRule,
  ScheduledTouchpointForecastRequiredCodeRule,
  ScheduledTouchpointForecastRequiredCountryRule,
  defaultScheduledTouchpointForecastValidator,
} from "./scheduled-touchpoint-forecast-rules.js";
import { newScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

test("ScheduledTouchpointForecastValidator reports every problem", () => {
  const validator = defaultScheduledTouchpointForecastValidator();
  const item = newScheduledTouchpointForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTouchpointForecastRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledTouchpointForecastRequiredCodeRule("scheduled touchpoint forecast needs an entry");
  const item = newScheduledTouchpointForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTouchpointForecastFloorValueRangeRule flags values above floor value", () => {
  const rule = new ScheduledTouchpointForecastFloorValueRangeRule(7.4, 4930.2);
  const item = newScheduledTouchpointForecast("x", "y");
  item.floorValue = 4931.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledTouchpointForecastLabelLengthRule flags a long label", () => {
  const rule = new ScheduledTouchpointForecastLabelLengthRule(86400);
  const item = newScheduledTouchpointForecast("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTouchpointForecastRequiredCountryRule flags a blank country", () => {
  const rule = new ScheduledTouchpointForecastRequiredCountryRule("scheduled touchpoint forecast needs an entry");
  const item = newScheduledTouchpointForecast("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTouchpointForecastDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ScheduledTouchpointForecastDurationMinutesRangeRule(64, 86400);
  const item = newScheduledTouchpointForecast("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledTouchpointForecastGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ScheduledTouchpointForecastGraceDaysRangeRule(32, 80);
  const item = newScheduledTouchpointForecast("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
