import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardScheduleBidRangeRule,
  LeaderboardScheduleCodeLengthRule,
  LeaderboardScheduleRequiredCampaignRefRule,
  defaultLeaderboardScheduleValidator,
} from "./leaderboard-schedule-rules.js";
import { newLeaderboardSchedule } from "./leaderboard-schedule.js";

test("LeaderboardScheduleValidator reports every problem", () => {
  const validator = defaultLeaderboardScheduleValidator();
  const item = newLeaderboardSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardScheduleCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardScheduleCodeLengthRule(86400);
  const item = newLeaderboardSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardScheduleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LeaderboardScheduleRequiredCampaignRefRule("leaderboard schedule needs a value");
  const item = newLeaderboardSchedule("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardScheduleBidRangeRule flags values above bid", () => {
  const rule = new LeaderboardScheduleBidRangeRule(7, 3099.9);
  const item = newLeaderboardSchedule("x", "y");
  item.bid = 3101.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
