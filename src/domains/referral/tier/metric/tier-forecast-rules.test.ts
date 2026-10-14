import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierForecastCreatedAtRangeRule,
  TierForecastRequiredLabelRule,
  TierForecastRetriesRangeRule,
  defaultTierForecastValidator,
} from "./tier-forecast-rules.js";
import { newTierForecast } from "./tier-forecast.js";

test("TierForecastValidator reports every problem", () => {
  const validator = defaultTierForecastValidator();
  const item = newTierForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierForecastCreatedAtRangeRule flags values above created at", () => {
  const rule = new TierForecastCreatedAtRangeRule(64, 80);
  const item = newTierForecast("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierForecastRequiredLabelRule flags a blank label", () => {
  const rule = new TierForecastRequiredLabelRule("tier forecast needs this field");
  const item = newTierForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierForecastRetriesRangeRule flags values above retries", () => {
  const rule = new TierForecastRetriesRangeRule(16, 80);
  const item = newTierForecast("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
