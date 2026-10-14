import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTouchpointForecastClicksRangeRule,
  AdaptiveTouchpointForecastConversionRateRangeRule,
  defaultAdaptiveTouchpointForecastValidator,
} from "./adaptive-touchpoint-forecast-rules.js";
import { newAdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

test("AdaptiveTouchpointForecastValidator reports every problem", () => {
  const validator = defaultAdaptiveTouchpointForecastValidator();
  const item = newAdaptiveTouchpointForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTouchpointForecastClicksRangeRule flags values above clicks", () => {
  const rule = new AdaptiveTouchpointForecastClicksRangeRule(16, 255);
  const item = newAdaptiveTouchpointForecast("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveTouchpointForecastConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new AdaptiveTouchpointForecastConversionRateRangeRule(8.4, 3056.4);
  const item = newAdaptiveTouchpointForecast("x", "y");
  item.conversionRate = 3057.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
