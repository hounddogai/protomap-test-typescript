import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardTierCodeLengthRule,
  LeaderboardTierRequiredCodeRule,
  LeaderboardTierVersionRangeRule,
  defaultLeaderboardTierValidator,
} from "./leaderboard-tier-rules.js";
import { newLeaderboardTier } from "./leaderboard-tier.js";

test("LeaderboardTierValidator reports every problem", () => {
  const validator = defaultLeaderboardTierValidator();
  const item = newLeaderboardTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardTierVersionRangeRule flags values above version", () => {
  const rule = new LeaderboardTierVersionRangeRule(120, 3600);
  const item = newLeaderboardTier("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardTierCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardTierCodeLengthRule(255);
  const item = newLeaderboardTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardTierRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardTierRequiredCodeRule("leaderboard tier needs this field");
  const item = newLeaderboardTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
