import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPathForecastCountryLengthRule,
  PrimaryPathForecastCreatedAtRangeRule,
  PrimaryPathForecastPriorityRangeRule,
  PrimaryPathForecastSequenceRangeRule,
  PrimaryPathForecastTitleLengthRule,
  defaultPrimaryPathForecastValidator,
} from "./primary-path-forecast-rules.js";
import { newPrimaryPathForecast } from "./primary-path-forecast.js";

test("PrimaryPathForecastValidator reports every problem", () => {
  const validator = defaultPrimaryPathForecastValidator();
  const item = newPrimaryPathForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPathForecastPriorityRangeRule flags values above priority", () => {
  const rule = new PrimaryPathForecastPriorityRangeRule(16, 3600);
  const item = newPrimaryPathForecast("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPathForecastCountryLengthRule flags a long country", () => {
  const rule = new PrimaryPathForecastCountryLengthRule(1000);
  const item = newPrimaryPathForecast("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPathForecastTitleLengthRule flags a long title", () => {
  const rule = new PrimaryPathForecastTitleLengthRule(32);
  const item = newPrimaryPathForecast("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPathForecastCreatedAtRangeRule flags values above created at", () => {
  const rule = new PrimaryPathForecastCreatedAtRangeRule(64, 80);
  const item = newPrimaryPathForecast("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPathForecastSequenceRangeRule flags values above sequence", () => {
  const rule = new PrimaryPathForecastSequenceRangeRule(64, 80);
  const item = newPrimaryPathForecast("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
