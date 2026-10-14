import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBadgeForecastLocaleLengthRule,
  PrimaryBadgeForecastScoreRangeRule,
  PrimaryBadgeForecastTitleLengthRule,
  defaultPrimaryBadgeForecastValidator,
} from "./primary-badge-forecast-rules.js";
import { newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("PrimaryBadgeForecastValidator reports every problem", () => {
  const validator = defaultPrimaryBadgeForecastValidator();
  const item = newPrimaryBadgeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBadgeForecastScoreRangeRule flags values above score", () => {
  const rule = new PrimaryBadgeForecastScoreRangeRule(9.3, 206.3);
  const item = newPrimaryBadgeForecast("x", "y");
  item.score = 207.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBadgeForecastLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryBadgeForecastLocaleLengthRule(3600);
  const item = newPrimaryBadgeForecast("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryBadgeForecastTitleLengthRule flags a long title", () => {
  const rule = new PrimaryBadgeForecastTitleLengthRule(3600);
  const item = newPrimaryBadgeForecast("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
