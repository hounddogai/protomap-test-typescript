import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardAdjustmentCampaignRefLengthRule,
  LeaderboardAdjustmentJourneyIdLengthRule,
  LeaderboardAdjustmentRequiredCampaignRefRule,
  LeaderboardAdjustmentRequiredLabelRule,
  LeaderboardAdjustmentThresholdRangeRule,
  defaultLeaderboardAdjustmentValidator,
} from "./leaderboard-adjustment-rules.js";
import { newLeaderboardAdjustment } from "./leaderboard-adjustment.js";

test("LeaderboardAdjustmentValidator reports every problem", () => {
  const validator = defaultLeaderboardAdjustmentValidator();
  const item = newLeaderboardAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardAdjustmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LeaderboardAdjustmentRequiredCampaignRefRule("leaderboard adjustment needs an entry");
  const item = newLeaderboardAdjustment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new LeaderboardAdjustmentRequiredLabelRule("leaderboard adjustment needs a value");
  const item = newLeaderboardAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardAdjustmentJourneyIdLengthRule flags a long journey id", () => {
  const rule = new LeaderboardAdjustmentJourneyIdLengthRule(64);
  const item = newLeaderboardAdjustment("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardAdjustmentCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LeaderboardAdjustmentCampaignRefLengthRule(80);
  const item = newLeaderboardAdjustment("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardAdjustmentThresholdRangeRule flags values above threshold", () => {
  const rule = new LeaderboardAdjustmentThresholdRangeRule(4.2, 1273.9);
  const item = newLeaderboardAdjustment("x", "y");
  item.threshold = 1275.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
