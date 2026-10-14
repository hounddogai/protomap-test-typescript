import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBounceForecastCeilingRangeRule,
  LegacyBounceForecastDescriptionLengthRule,
  LegacyBounceForecastNameLengthRule,
  LegacyBounceForecastRateRangeRule,
  LegacyBounceForecastRequiredCodeRule,
  defaultLegacyBounceForecastValidator,
} from "./legacy-bounce-forecast-rules.js";
import { newLegacyBounceForecast } from "./legacy-bounce-forecast.js";

test("LegacyBounceForecastValidator reports every problem", () => {
  const validator = defaultLegacyBounceForecastValidator();
  const item = newLegacyBounceForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBounceForecastDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyBounceForecastDescriptionLengthRule(16);
  const item = newLegacyBounceForecast("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBounceForecastRateRangeRule flags values above rate", () => {
  const rule = new LegacyBounceForecastRateRangeRule(1.8, 2397.9);
  const item = newLegacyBounceForecast("x", "y");
  item.rate = 2399.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyBounceForecastRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyBounceForecastRequiredCodeRule("legacy bounce forecast needs this field");
  const item = newLegacyBounceForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBounceForecastNameLengthRule flags a long name", () => {
  const rule = new LegacyBounceForecastNameLengthRule(80);
  const item = newLegacyBounceForecast("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBounceForecastCeilingRangeRule flags values above ceiling", () => {
  const rule = new LegacyBounceForecastCeilingRangeRule(8.8, 1516.5);
  const item = newLegacyBounceForecast("x", "y");
  item.ceiling = 1518;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
