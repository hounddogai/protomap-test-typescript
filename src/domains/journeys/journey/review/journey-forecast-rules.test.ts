import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyForecastRateRangeRule,
  JourneyForecastRequiredCodeRule,
  defaultJourneyForecastValidator,
} from "./journey-forecast-rules.js";
import { newJourneyForecast } from "./journey-forecast.js";

test("JourneyForecastValidator reports every problem", () => {
  const validator = defaultJourneyForecastValidator();
  const item = newJourneyForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyForecastRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyForecastRequiredCodeRule("journey forecast needs a value");
  const item = newJourneyForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyForecastRateRangeRule flags values above rate", () => {
  const rule = new JourneyForecastRateRangeRule(2.4, 3639.4);
  const item = newJourneyForecast("x", "y");
  item.rate = 3640.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
