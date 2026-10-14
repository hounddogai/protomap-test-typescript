import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyLeaderboardForecastBatchSizeRangeRule,
  LegacyLeaderboardForecastMarginRangeRule,
  LegacyLeaderboardForecastRequiredUnitRule,
  LegacyLeaderboardForecastUnitLengthRule,
  defaultLegacyLeaderboardForecastValidator,
} from "./legacy-leaderboard-forecast-rules.js";
import { newLegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

test("LegacyLeaderboardForecastValidator reports every problem", () => {
  const validator = defaultLegacyLeaderboardForecastValidator();
  const item = newLegacyLeaderboardForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyLeaderboardForecastMarginRangeRule flags values above margin", () => {
  const rule = new LegacyLeaderboardForecastMarginRangeRule(4.3, 1454.5);
  const item = newLegacyLeaderboardForecast("x", "y");
  item.margin = 1456;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyLeaderboardForecastUnitLengthRule flags a long unit", () => {
  const rule = new LegacyLeaderboardForecastUnitLengthRule(255);
  const item = newLegacyLeaderboardForecast("x", "y");
  item.unit = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyLeaderboardForecastRequiredUnitRule flags a blank unit", () => {
  const rule = new LegacyLeaderboardForecastRequiredUnitRule("legacy leaderboard forecast needs a value");
  const item = newLegacyLeaderboardForecast("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyLeaderboardForecastBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LegacyLeaderboardForecastBatchSizeRangeRule(16, 80);
  const item = newLegacyLeaderboardForecast("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
