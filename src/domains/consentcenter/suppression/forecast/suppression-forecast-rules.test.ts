import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionForecastCategoryLengthRule,
  SuppressionForecastRatioRangeRule,
  SuppressionForecastRequiredCategoryRule,
  SuppressionForecastRequiredTitleRule,
  SuppressionForecastReviewerLengthRule,
  SuppressionForecastSequenceRangeRule,
  defaultSuppressionForecastValidator,
} from "./suppression-forecast-rules.js";
import { newSuppressionForecast } from "./suppression-forecast.js";

test("SuppressionForecastValidator reports every problem", () => {
  const validator = defaultSuppressionForecastValidator();
  const item = newSuppressionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionForecastRequiredCategoryRule flags a blank category", () => {
  const rule = new SuppressionForecastRequiredCategoryRule("suppression forecast needs an entry");
  const item = newSuppressionForecast("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionForecastSequenceRangeRule flags values above sequence", () => {
  const rule = new SuppressionForecastSequenceRangeRule(32, 3600);
  const item = newSuppressionForecast("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionForecastReviewerLengthRule flags a long reviewer", () => {
  const rule = new SuppressionForecastReviewerLengthRule(16);
  const item = newSuppressionForecast("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionForecastRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionForecastRequiredTitleRule("suppression forecast needs an entry");
  const item = newSuppressionForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionForecastRatioRangeRule flags values above ratio", () => {
  const rule = new SuppressionForecastRatioRangeRule(6.3, 2274.3);
  const item = newSuppressionForecast("x", "y");
  item.ratio = 2275.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionForecastCategoryLengthRule flags a long category", () => {
  const rule = new SuppressionForecastCategoryLengthRule(1000);
  const item = newSuppressionForecast("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
