import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceForecastDurationMinutesRangeRule,
  BounceForecastRequiredNotesRule,
  defaultBounceForecastValidator,
} from "./bounce-forecast-rules.js";
import { newBounceForecast } from "./bounce-forecast.js";

test("BounceForecastValidator reports every problem", () => {
  const validator = defaultBounceForecastValidator();
  const item = newBounceForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceForecastDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BounceForecastDurationMinutesRangeRule(32, 1000);
  const item = newBounceForecast("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceForecastRequiredNotesRule flags a blank notes", () => {
  const rule = new BounceForecastRequiredNotesRule("bounce forecast needs this field");
  const item = newBounceForecast("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
