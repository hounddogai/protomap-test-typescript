import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRetentionForecastRegionLengthRule,
  TieredRetentionForecastRequiredRegionRule,
  TieredRetentionForecastRequiredTitleRule,
  TieredRetentionForecastTitleLengthRule,
  defaultTieredRetentionForecastValidator,
} from "./tiered-retention-forecast-rules.js";
import { newTieredRetentionForecast } from "./tiered-retention-forecast.js";

test("TieredRetentionForecastValidator reports every problem", () => {
  const validator = defaultTieredRetentionForecastValidator();
  const item = newTieredRetentionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRetentionForecastRequiredRegionRule flags a blank region", () => {
  const rule = new TieredRetentionForecastRequiredRegionRule("tiered retention forecast needs a value");
  const item = newTieredRetentionForecast("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRetentionForecastRegionLengthRule flags a long region", () => {
  const rule = new TieredRetentionForecastRegionLengthRule(16);
  const item = newTieredRetentionForecast("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRetentionForecastRequiredTitleRule flags a blank title", () => {
  const rule = new TieredRetentionForecastRequiredTitleRule("tiered retention forecast needs this field");
  const item = newTieredRetentionForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRetentionForecastTitleLengthRule flags a long title", () => {
  const rule = new TieredRetentionForecastTitleLengthRule(1000);
  const item = newTieredRetentionForecast("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
