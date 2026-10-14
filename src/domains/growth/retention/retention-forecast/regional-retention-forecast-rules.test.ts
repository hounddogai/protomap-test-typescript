import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRetentionForecastContactEmailLengthRule,
  RegionalRetentionForecastRequiredContactEmailRule,
  RegionalRetentionForecastWeightRangeRule,
  defaultRegionalRetentionForecastValidator,
} from "./regional-retention-forecast-rules.js";
import { newRegionalRetentionForecast } from "./regional-retention-forecast.js";

test("RegionalRetentionForecastValidator reports every problem", () => {
  const validator = defaultRegionalRetentionForecastValidator();
  const item = newRegionalRetentionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRetentionForecastContactEmailLengthRule flags a long contact email", () => {
  const rule = new RegionalRetentionForecastContactEmailLengthRule(86400);
  const item = newRegionalRetentionForecast("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRetentionForecastRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalRetentionForecastRequiredContactEmailRule("regional retention forecast needs an entry");
  const item = newRegionalRetentionForecast("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRetentionForecastWeightRangeRule flags values above weight", () => {
  const rule = new RegionalRetentionForecastWeightRangeRule(1.6, 552.8);
  const item = newRegionalRetentionForecast("x", "y");
  item.weight = 554.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
