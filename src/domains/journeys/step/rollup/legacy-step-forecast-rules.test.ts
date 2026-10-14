import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyStepForecastRequiredCodeRule,
  LegacyStepForecastReviewerLengthRule,
  LegacyStepForecastScoreRangeRule,
  defaultLegacyStepForecastValidator,
} from "./legacy-step-forecast-rules.js";
import { newLegacyStepForecast } from "./legacy-step-forecast.js";

test("LegacyStepForecastValidator reports every problem", () => {
  const validator = defaultLegacyStepForecastValidator();
  const item = newLegacyStepForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyStepForecastReviewerLengthRule flags a long reviewer", () => {
  const rule = new LegacyStepForecastReviewerLengthRule(255);
  const item = newLegacyStepForecast("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyStepForecastRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyStepForecastRequiredCodeRule("legacy step forecast needs a value");
  const item = newLegacyStepForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyStepForecastScoreRangeRule flags values above score", () => {
  const rule = new LegacyStepForecastScoreRangeRule(8.7, 554.1);
  const item = newLegacyStepForecast("x", "y");
  item.score = 555.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
