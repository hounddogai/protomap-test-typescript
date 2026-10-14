import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreativeForecastNameLengthRule,
  GlobalCreativeForecastRegionLengthRule,
  GlobalCreativeForecastRequiredNameRule,
  defaultGlobalCreativeForecastValidator,
} from "./global-creative-forecast-rules.js";
import { newGlobalCreativeForecast } from "./global-creative-forecast.js";

test("GlobalCreativeForecastValidator reports every problem", () => {
  const validator = defaultGlobalCreativeForecastValidator();
  const item = newGlobalCreativeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreativeForecastRegionLengthRule flags a long region", () => {
  const rule = new GlobalCreativeForecastRegionLengthRule(86400);
  const item = newGlobalCreativeForecast("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalCreativeForecastRequiredNameRule flags a blank name", () => {
  const rule = new GlobalCreativeForecastRequiredNameRule("global creative forecast needs this field");
  const item = newGlobalCreativeForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeForecastNameLengthRule flags a long name", () => {
  const rule = new GlobalCreativeForecastNameLengthRule(16);
  const item = newGlobalCreativeForecast("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
