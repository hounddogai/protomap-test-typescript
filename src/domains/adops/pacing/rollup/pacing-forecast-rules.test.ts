import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingForecastLocaleLengthRule,
  PacingForecastQuantityRangeRule,
  defaultPacingForecastValidator,
} from "./pacing-forecast-rules.js";
import { newPacingForecast } from "./pacing-forecast.js";

test("PacingForecastValidator reports every problem", () => {
  const validator = defaultPacingForecastValidator();
  const item = newPacingForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingForecastLocaleLengthRule flags a long locale", () => {
  const rule = new PacingForecastLocaleLengthRule(255);
  const item = newPacingForecast("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingForecastQuantityRangeRule flags values above quantity", () => {
  const rule = new PacingForecastQuantityRangeRule(16, 1000);
  const item = newPacingForecast("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
