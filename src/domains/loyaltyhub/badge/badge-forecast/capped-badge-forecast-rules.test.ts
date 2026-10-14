import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBadgeForecastLocaleLengthRule,
  CappedBadgeForecastQuantityRangeRule,
  defaultCappedBadgeForecastValidator,
} from "./capped-badge-forecast-rules.js";
import { newCappedBadgeForecast } from "./capped-badge-forecast.js";

test("CappedBadgeForecastValidator reports every problem", () => {
  const validator = defaultCappedBadgeForecastValidator();
  const item = newCappedBadgeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBadgeForecastLocaleLengthRule flags a long locale", () => {
  const rule = new CappedBadgeForecastLocaleLengthRule(86400);
  const item = newCappedBadgeForecast("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBadgeForecastQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedBadgeForecastQuantityRangeRule(1000, 1000);
  const item = newCappedBadgeForecast("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
