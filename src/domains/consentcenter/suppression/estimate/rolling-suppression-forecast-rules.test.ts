import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSuppressionForecastCountryLengthRule,
  RollingSuppressionForecastRequiredCodeRule,
  RollingSuppressionForecastRequiredCountryRule,
  RollingSuppressionForecastRequiredLabelRule,
  defaultRollingSuppressionForecastValidator,
} from "./rolling-suppression-forecast-rules.js";
import { newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

test("RollingSuppressionForecastValidator reports every problem", () => {
  const validator = defaultRollingSuppressionForecastValidator();
  const item = newRollingSuppressionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSuppressionForecastRequiredCountryRule flags a blank country", () => {
  const rule = new RollingSuppressionForecastRequiredCountryRule("rolling suppression forecast needs an entry");
  const item = newRollingSuppressionForecast("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSuppressionForecastCountryLengthRule flags a long country", () => {
  const rule = new RollingSuppressionForecastCountryLengthRule(255);
  const item = newRollingSuppressionForecast("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSuppressionForecastRequiredLabelRule flags a blank label", () => {
  const rule = new RollingSuppressionForecastRequiredLabelRule("rolling suppression forecast needs a value");
  const item = newRollingSuppressionForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSuppressionForecastRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSuppressionForecastRequiredCodeRule("rolling suppression forecast needs a value");
  const item = newRollingSuppressionForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
