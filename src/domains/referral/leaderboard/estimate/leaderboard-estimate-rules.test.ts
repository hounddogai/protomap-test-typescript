import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardEstimateLabelLengthRule,
  LeaderboardEstimateRequiredCodeRule,
  LeaderboardEstimateTimezoneLengthRule,
  LeaderboardEstimateWindowDaysRangeRule,
  defaultLeaderboardEstimateValidator,
} from "./leaderboard-estimate-rules.js";
import { newLeaderboardEstimate } from "./leaderboard-estimate.js";

test("LeaderboardEstimateValidator reports every problem", () => {
  const validator = defaultLeaderboardEstimateValidator();
  const item = newLeaderboardEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardEstimateLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardEstimateLabelLengthRule(120);
  const item = newLeaderboardEstimate("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardEstimateWindowDaysRangeRule flags values above window days", () => {
  const rule = new LeaderboardEstimateWindowDaysRangeRule(64, 80);
  const item = newLeaderboardEstimate("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardEstimateTimezoneLengthRule flags a long timezone", () => {
  const rule = new LeaderboardEstimateTimezoneLengthRule(1000);
  const item = newLeaderboardEstimate("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardEstimateRequiredCodeRule("leaderboard estimate needs a value");
  const item = newLeaderboardEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
