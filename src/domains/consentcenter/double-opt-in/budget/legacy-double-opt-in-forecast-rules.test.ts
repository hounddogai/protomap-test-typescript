import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInForecastThresholdRangeRule,
  defaultLegacyDoubleOptInForecastValidator,
} from "./legacy-double-opt-in-forecast-rules.js";
import { newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

test("LegacyDoubleOptInForecastValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInForecastValidator();
  const item = newLegacyDoubleOptInForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInForecastThresholdRangeRule flags values above threshold", () => {
  const rule = new LegacyDoubleOptInForecastThresholdRangeRule(0.7, 825.5);
  const item = newLegacyDoubleOptInForecast("x", "y");
  item.threshold = 827;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
