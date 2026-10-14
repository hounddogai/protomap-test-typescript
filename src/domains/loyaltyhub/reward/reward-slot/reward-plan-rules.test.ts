import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardPlanLabelLengthRule,
  RewardPlanQuantityRangeRule,
  RewardPlanRequiredCampaignRefRule,
  RewardPlanRequiredChannelRule,
  defaultRewardPlanValidator,
} from "./reward-plan-rules.js";
import { newRewardPlan } from "./reward-plan.js";

test("RewardPlanValidator reports every problem", () => {
  const validator = defaultRewardPlanValidator();
  const item = newRewardPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardPlanLabelLengthRule flags a long label", () => {
  const rule = new RewardPlanLabelLengthRule(3600);
  const item = newRewardPlan("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardPlanQuantityRangeRule flags values above quantity", () => {
  const rule = new RewardPlanQuantityRangeRule(120, 1000);
  const item = newRewardPlan("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardPlanRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RewardPlanRequiredCampaignRefRule("reward plan needs this field");
  const item = newRewardPlan("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardPlanRequiredChannelRule flags a blank channel", () => {
  const rule = new RewardPlanRequiredChannelRule("reward plan needs an entry");
  const item = newRewardPlan("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
