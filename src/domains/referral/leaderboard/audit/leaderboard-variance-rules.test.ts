import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardVarianceRateRangeRule,
  LeaderboardVarianceRequiredCodeRule,
  LeaderboardVarianceUpdatedAtRangeRule,
  defaultLeaderboardVarianceValidator,
} from "./leaderboard-variance-rules.js";
import { newLeaderboardVariance } from "./leaderboard-variance.js";

test("LeaderboardVarianceValidator reports every problem", () => {
  const validator = defaultLeaderboardVarianceValidator();
  const item = newLeaderboardVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardVarianceRateRangeRule flags values above rate", () => {
  const rule = new LeaderboardVarianceRateRangeRule(8.7, 4600.8);
  const item = newLeaderboardVariance("x", "y");
  item.rate = 4602.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardVarianceRequiredCodeRule("leaderboard variance needs an entry");
  const item = newLeaderboardVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardVarianceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LeaderboardVarianceUpdatedAtRangeRule(16, 64);
  const item = newLeaderboardVariance("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
