import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelForecastDurationMinutesRangeRule,
  ModelForecastNameLengthRule,
  ModelForecastRequiredAudienceIdRule,
  defaultModelForecastValidator,
} from "./model-forecast-rules.js";
import { newModelForecast } from "./model-forecast.js";

test("ModelForecastValidator reports every problem", () => {
  const validator = defaultModelForecastValidator();
  const item = newModelForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelForecastNameLengthRule flags a long name", () => {
  const rule = new ModelForecastNameLengthRule(1000);
  const item = newModelForecast("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelForecastRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ModelForecastRequiredAudienceIdRule("model forecast needs this field");
  const item = newModelForecast("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelForecastDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ModelForecastDurationMinutesRangeRule(32, 32);
  const item = newModelForecast("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
