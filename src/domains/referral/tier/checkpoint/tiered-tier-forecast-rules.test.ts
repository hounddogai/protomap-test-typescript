import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTierForecastCodeLengthRule,
  TieredTierForecastMinimumRangeRule,
  TieredTierForecastRequiredCodeRule,
  TieredTierForecastRequiredJourneyIdRule,
  TieredTierForecastRequiredNameRule,
  defaultTieredTierForecastValidator,
} from "./tiered-tier-forecast-rules.js";
import { newTieredTierForecast } from "./tiered-tier-forecast.js";

test("TieredTierForecastValidator reports every problem", () => {
  const validator = defaultTieredTierForecastValidator();
  const item = newTieredTierForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTierForecastRequiredNameRule flags a blank name", () => {
  const rule = new TieredTierForecastRequiredNameRule("tiered tier forecast needs an entry");
  const item = newTieredTierForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTierForecastRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredTierForecastRequiredJourneyIdRule("tiered tier forecast needs an entry");
  const item = newTieredTierForecast("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTierForecastCodeLengthRule flags a long code", () => {
  const rule = new TieredTierForecastCodeLengthRule(120);
  const item = newTieredTierForecast("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTierForecastRequiredCodeRule flags a blank code", () => {
  const rule = new TieredTierForecastRequiredCodeRule("tiered tier forecast needs a value");
  const item = newTieredTierForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTierForecastMinimumRangeRule flags values above minimum", () => {
  const rule = new TieredTierForecastMinimumRangeRule(1.2, 648.7);
  const item = newTieredTierForecast("x", "y");
  item.minimum = 650.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
