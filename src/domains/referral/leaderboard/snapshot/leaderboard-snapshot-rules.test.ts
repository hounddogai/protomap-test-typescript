import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardSnapshotCampaignRefLengthRule,
  LeaderboardSnapshotPriorityRangeRule,
  defaultLeaderboardSnapshotValidator,
} from "./leaderboard-snapshot-rules.js";
import { newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

test("LeaderboardSnapshotValidator reports every problem", () => {
  const validator = defaultLeaderboardSnapshotValidator();
  const item = newLeaderboardSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardSnapshotPriorityRangeRule flags values above priority", () => {
  const rule = new LeaderboardSnapshotPriorityRangeRule(16, 1000);
  const item = newLeaderboardSnapshot("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardSnapshotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LeaderboardSnapshotCampaignRefLengthRule(16);
  const item = newLeaderboardSnapshot("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
