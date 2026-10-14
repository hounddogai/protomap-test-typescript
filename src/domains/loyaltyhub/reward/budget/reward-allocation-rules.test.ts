import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardAllocationCampaignRefLengthRule,
  RewardAllocationRequiredCampaignRefRule,
  defaultRewardAllocationValidator,
} from "./reward-allocation-rules.js";
import { newRewardAllocation } from "./reward-allocation.js";

test("RewardAllocationValidator reports every problem", () => {
  const validator = defaultRewardAllocationValidator();
  const item = newRewardAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardAllocationRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RewardAllocationRequiredCampaignRefRule("reward allocation needs an entry");
  const item = newRewardAllocation("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardAllocationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RewardAllocationCampaignRefLengthRule(16);
  const item = newRewardAllocation("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
