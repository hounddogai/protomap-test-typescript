import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardMilestoneCodeLengthRule,
  LeaderboardMilestoneLabelLengthRule,
  LeaderboardMilestoneOpenRateRangeRule,
  LeaderboardMilestoneRequiredCodeRule,
  LeaderboardMilestoneRequiredSummaryRule,
  LeaderboardMilestoneSummaryLengthRule,
  defaultLeaderboardMilestoneValidator,
} from "./leaderboard-milestone-rules.js";
import { newLeaderboardMilestone } from "./leaderboard-milestone.js";

test("LeaderboardMilestoneValidator reports every problem", () => {
  const validator = defaultLeaderboardMilestoneValidator();
  const item = newLeaderboardMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardMilestoneRequiredCodeRule("leaderboard milestone needs this field");
  const item = newLeaderboardMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardMilestoneLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardMilestoneLabelLengthRule(80);
  const item = newLeaderboardMilestone("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardMilestoneSummaryLengthRule flags a long summary", () => {
  const rule = new LeaderboardMilestoneSummaryLengthRule(3600);
  const item = newLeaderboardMilestone("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardMilestoneRequiredSummaryRule flags a blank summary", () => {
  const rule = new LeaderboardMilestoneRequiredSummaryRule("leaderboard milestone needs this field");
  const item = newLeaderboardMilestone("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardMilestoneOpenRateRangeRule flags values above open rate", () => {
  const rule = new LeaderboardMilestoneOpenRateRangeRule(6.2, 389.2);
  const item = newLeaderboardMilestone("x", "y");
  item.openRate = 390.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardMilestoneCodeLengthRule(86400);
  const item = newLeaderboardMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
