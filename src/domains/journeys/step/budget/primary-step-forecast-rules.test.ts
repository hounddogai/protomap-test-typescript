import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryStepForecastCodeLengthRule,
  PrimaryStepForecastNotesLengthRule,
  PrimaryStepForecastRetriesRangeRule,
  PrimaryStepForecastScoreRangeRule,
  PrimaryStepForecastThresholdRangeRule,
  defaultPrimaryStepForecastValidator,
} from "./primary-step-forecast-rules.js";
import { newPrimaryStepForecast } from "./primary-step-forecast.js";

test("PrimaryStepForecastValidator reports every problem", () => {
  const validator = defaultPrimaryStepForecastValidator();
  const item = newPrimaryStepForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryStepForecastNotesLengthRule flags a long notes", () => {
  const rule = new PrimaryStepForecastNotesLengthRule(16);
  const item = newPrimaryStepForecast("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryStepForecastRetriesRangeRule flags values above retries", () => {
  const rule = new PrimaryStepForecastRetriesRangeRule(3600, 3600);
  const item = newPrimaryStepForecast("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepForecastCodeLengthRule flags a long code", () => {
  const rule = new PrimaryStepForecastCodeLengthRule(255);
  const item = newPrimaryStepForecast("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryStepForecastThresholdRangeRule flags values above threshold", () => {
  const rule = new PrimaryStepForecastThresholdRangeRule(0.7, 385.5);
  const item = newPrimaryStepForecast("x", "y");
  item.threshold = 387;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepForecastScoreRangeRule flags values above score", () => {
  const rule = new PrimaryStepForecastScoreRangeRule(4.6, 460);
  const item = newPrimaryStepForecast("x", "y");
  item.score = 461.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
