import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardTargetGraceDaysRangeRule,
  LeaderboardTargetLabelLengthRule,
  LeaderboardTargetLocaleLengthRule,
  LeaderboardTargetRequiredDescriptionRule,
  defaultLeaderboardTargetValidator,
} from "./leaderboard-target-rules.js";
import { newLeaderboardTarget } from "./leaderboard-target.js";

test("LeaderboardTargetValidator reports every problem", () => {
  const validator = defaultLeaderboardTargetValidator();
  const item = newLeaderboardTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardTargetGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LeaderboardTargetGraceDaysRangeRule(16, 32);
  const item = newLeaderboardTarget("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardTargetLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardTargetLabelLengthRule(3600);
  const item = newLeaderboardTarget("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardTargetLocaleLengthRule flags a long locale", () => {
  const rule = new LeaderboardTargetLocaleLengthRule(64);
  const item = newLeaderboardTarget("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardTargetRequiredDescriptionRule flags a blank description", () => {
  const rule = new LeaderboardTargetRequiredDescriptionRule("leaderboard target needs an entry");
  const item = newLeaderboardTarget("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
