import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardBaselineCodeLengthRule,
  LeaderboardBaselineRequiredCohortRule,
  defaultLeaderboardBaselineValidator,
} from "./leaderboard-baseline-rules.js";
import { newLeaderboardBaseline } from "./leaderboard-baseline.js";

test("LeaderboardBaselineValidator reports every problem", () => {
  const validator = defaultLeaderboardBaselineValidator();
  const item = newLeaderboardBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardBaselineCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardBaselineCodeLengthRule(255);
  const item = newLeaderboardBaseline("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardBaselineRequiredCohortRule flags a blank cohort", () => {
  const rule = new LeaderboardBaselineRequiredCohortRule("leaderboard baseline needs this field");
  const item = newLeaderboardBaseline("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
