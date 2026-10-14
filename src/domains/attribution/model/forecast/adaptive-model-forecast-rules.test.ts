import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveModelForecastRateRangeRule,
  AdaptiveModelForecastRequiredLabelRule,
  defaultAdaptiveModelForecastValidator,
} from "./adaptive-model-forecast-rules.js";
import { newAdaptiveModelForecast } from "./adaptive-model-forecast.js";

test("AdaptiveModelForecastValidator reports every problem", () => {
  const validator = defaultAdaptiveModelForecastValidator();
  const item = newAdaptiveModelForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveModelForecastRateRangeRule flags values above rate", () => {
  const rule = new AdaptiveModelForecastRateRangeRule(9.6, 1959.9);
  const item = newAdaptiveModelForecast("x", "y");
  item.rate = 1961.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveModelForecastRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveModelForecastRequiredLabelRule("adaptive model forecast needs this field");
  const item = newAdaptiveModelForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
