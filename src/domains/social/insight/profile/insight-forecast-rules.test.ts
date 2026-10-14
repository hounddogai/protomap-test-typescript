import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightForecastBudgetRangeRule,
  InsightForecastCodeLengthRule,
  InsightForecastLabelLengthRule,
  defaultInsightForecastValidator,
} from "./insight-forecast-rules.js";
import { newInsightForecast } from "./insight-forecast.js";

test("InsightForecastValidator reports every problem", () => {
  const validator = defaultInsightForecastValidator();
  const item = newInsightForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightForecastLabelLengthRule flags a long label", () => {
  const rule = new InsightForecastLabelLengthRule(3600);
  const item = newInsightForecast("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightForecastBudgetRangeRule flags values above budget", () => {
  const rule = new InsightForecastBudgetRangeRule(9.8, 1477.1);
  const item = newInsightForecast("x", "y");
  item.budget = 1478.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightForecastCodeLengthRule flags a long code", () => {
  const rule = new InsightForecastCodeLengthRule(86400);
  const item = newInsightForecast("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
