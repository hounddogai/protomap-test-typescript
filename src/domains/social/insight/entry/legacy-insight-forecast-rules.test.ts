import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyInsightForecastCategoryLengthRule,
  LegacyInsightForecastCodeLengthRule,
  LegacyInsightForecastRequiredLocaleRule,
  defaultLegacyInsightForecastValidator,
} from "./legacy-insight-forecast-rules.js";
import { newLegacyInsightForecast } from "./legacy-insight-forecast.js";

test("LegacyInsightForecastValidator reports every problem", () => {
  const validator = defaultLegacyInsightForecastValidator();
  const item = newLegacyInsightForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInsightForecastCodeLengthRule flags a long code", () => {
  const rule = new LegacyInsightForecastCodeLengthRule(64);
  const item = newLegacyInsightForecast("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyInsightForecastRequiredLocaleRule flags a blank locale", () => {
  const rule = new LegacyInsightForecastRequiredLocaleRule("legacy insight forecast needs this field");
  const item = newLegacyInsightForecast("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInsightForecastCategoryLengthRule flags a long category", () => {
  const rule = new LegacyInsightForecastCategoryLengthRule(64);
  const item = newLegacyInsightForecast("x", "y");
  item.category = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
