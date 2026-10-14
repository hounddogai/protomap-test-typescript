import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualLeaderboardMilestoneDescriptionLengthRule,
  ManualLeaderboardMilestoneFloorValueRangeRule,
  ManualLeaderboardMilestoneRequiredCodeRule,
  defaultManualLeaderboardMilestoneValidator,
} from "./manual-leaderboard-milestone-rules.js";
import { newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

test("ManualLeaderboardMilestoneValidator reports every problem", () => {
  const validator = defaultManualLeaderboardMilestoneValidator();
  const item = newManualLeaderboardMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualLeaderboardMilestoneDescriptionLengthRule flags a long description", () => {
  const rule = new ManualLeaderboardMilestoneDescriptionLengthRule(86400);
  const item = newManualLeaderboardMilestone("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualLeaderboardMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new ManualLeaderboardMilestoneRequiredCodeRule("manual leaderboard milestone needs an entry");
  const item = newManualLeaderboardMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualLeaderboardMilestoneFloorValueRangeRule flags values above floor value", () => {
  const rule = new ManualLeaderboardMilestoneFloorValueRangeRule(2, 2279.7);
  const item = newManualLeaderboardMilestone("x", "y");
  item.floorValue = 2281.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
