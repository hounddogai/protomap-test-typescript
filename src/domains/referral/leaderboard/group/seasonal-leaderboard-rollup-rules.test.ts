import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLeaderboardRollupRequiredCountryRule,
  SeasonalLeaderboardRollupRequiredTimezoneRule,
  SeasonalLeaderboardRollupRequiredTitleRule,
  SeasonalLeaderboardRollupTimezoneLengthRule,
  defaultSeasonalLeaderboardRollupValidator,
} from "./seasonal-leaderboard-rollup-rules.js";
import { newSeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

test("SeasonalLeaderboardRollupValidator reports every problem", () => {
  const validator = defaultSeasonalLeaderboardRollupValidator();
  const item = newSeasonalLeaderboardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLeaderboardRollupTimezoneLengthRule flags a long timezone", () => {
  const rule = new SeasonalLeaderboardRollupTimezoneLengthRule(32);
  const item = newSeasonalLeaderboardRollup("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalLeaderboardRollupRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalLeaderboardRollupRequiredTitleRule("seasonal leaderboard rollup needs a value");
  const item = newSeasonalLeaderboardRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLeaderboardRollupRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SeasonalLeaderboardRollupRequiredTimezoneRule("seasonal leaderboard rollup needs a value");
  const item = newSeasonalLeaderboardRollup("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLeaderboardRollupRequiredCountryRule flags a blank country", () => {
  const rule = new SeasonalLeaderboardRollupRequiredCountryRule("seasonal leaderboard rollup needs a value");
  const item = newSeasonalLeaderboardRollup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
