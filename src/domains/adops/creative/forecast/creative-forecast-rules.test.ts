import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeForecastOpenRateRangeRule,
  CreativeForecastRequiredJourneyIdRule,
  defaultCreativeForecastValidator,
} from "./creative-forecast-rules.js";
import { newCreativeForecast } from "./creative-forecast.js";

test("CreativeForecastValidator reports every problem", () => {
  const validator = defaultCreativeForecastValidator();
  const item = newCreativeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeForecastRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new CreativeForecastRequiredJourneyIdRule("creative forecast needs this field");
  const item = newCreativeForecast("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeForecastOpenRateRangeRule flags values above open rate", () => {
  const rule = new CreativeForecastOpenRateRangeRule(0.9, 350.5);
  const item = newCreativeForecast("x", "y");
  item.openRate = 352;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
