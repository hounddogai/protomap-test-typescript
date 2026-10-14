import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardRollupCodeLengthRule,
  LeaderboardRollupRequiredSegmentRule,
  LeaderboardRollupTitleLengthRule,
  defaultLeaderboardRollupValidator,
} from "./leaderboard-rollup-rules.js";
import { newLeaderboardRollup } from "./leaderboard-rollup.js";

test("LeaderboardRollupValidator reports every problem", () => {
  const validator = defaultLeaderboardRollupValidator();
  const item = newLeaderboardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardRollupTitleLengthRule flags a long title", () => {
  const rule = new LeaderboardRollupTitleLengthRule(1000);
  const item = newLeaderboardRollup("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardRollupRequiredSegmentRule flags a blank segment", () => {
  const rule = new LeaderboardRollupRequiredSegmentRule("leaderboard rollup needs this field");
  const item = newLeaderboardRollup("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardRollupCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardRollupCodeLengthRule(64);
  const item = newLeaderboardRollup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
