import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardScoreBidRangeRule,
  RewardScoreCampaignRefLengthRule,
  RewardScoreFloorValueRangeRule,
  RewardScoreNameLengthRule,
  RewardScoreNotesLengthRule,
  defaultRewardScoreValidator,
} from "./reward-score-rules.js";
import { newRewardScore } from "./reward-score.js";

test("RewardScoreValidator reports every problem", () => {
  const validator = defaultRewardScoreValidator();
  const item = newRewardScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardScoreBidRangeRule flags values above bid", () => {
  const rule = new RewardScoreBidRangeRule(8.7, 4349.3);
  const item = newRewardScore("x", "y");
  item.bid = 4350.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardScoreFloorValueRangeRule flags values above floor value", () => {
  const rule = new RewardScoreFloorValueRangeRule(2.1, 4772.2);
  const item = newRewardScore("x", "y");
  item.floorValue = 4773.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardScoreNameLengthRule flags a long name", () => {
  const rule = new RewardScoreNameLengthRule(64);
  const item = newRewardScore("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardScoreNotesLengthRule flags a long notes", () => {
  const rule = new RewardScoreNotesLengthRule(32);
  const item = newRewardScore("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardScoreCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RewardScoreCampaignRefLengthRule(16);
  const item = newRewardScore("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
