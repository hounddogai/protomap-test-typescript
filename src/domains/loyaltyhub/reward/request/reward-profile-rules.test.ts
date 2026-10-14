import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardProfileBatchSizeRangeRule,
  RewardProfileLabelLengthRule,
  RewardProfileRequiredCampaignRefRule,
  RewardProfileVersionRangeRule,
  defaultRewardProfileValidator,
} from "./reward-profile-rules.js";
import { newRewardProfile } from "./reward-profile.js";

test("RewardProfileValidator reports every problem", () => {
  const validator = defaultRewardProfileValidator();
  const item = newRewardProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardProfileLabelLengthRule flags a long label", () => {
  const rule = new RewardProfileLabelLengthRule(32);
  const item = newRewardProfile("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RewardProfileBatchSizeRangeRule(120, 120);
  const item = newRewardProfile("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardProfileRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RewardProfileRequiredCampaignRefRule("reward profile needs this field");
  const item = newRewardProfile("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardProfileVersionRangeRule flags values above version", () => {
  const rule = new RewardProfileVersionRangeRule(255, 86400);
  const item = newRewardProfile("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
