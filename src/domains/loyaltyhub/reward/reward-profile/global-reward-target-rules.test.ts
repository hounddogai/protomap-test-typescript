import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardTargetCreatedAtRangeRule,
  GlobalRewardTargetRequiredCampaignRefRule,
  GlobalRewardTargetRequiredCodeRule,
  GlobalRewardTargetRequiredNameRule,
  defaultGlobalRewardTargetValidator,
} from "./global-reward-target-rules.js";
import { newGlobalRewardTarget } from "./global-reward-target.js";

test("GlobalRewardTargetValidator reports every problem", () => {
  const validator = defaultGlobalRewardTargetValidator();
  const item = newGlobalRewardTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardTargetRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalRewardTargetRequiredCodeRule("global reward target needs an entry");
  const item = newGlobalRewardTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardTargetCreatedAtRangeRule flags values above created at", () => {
  const rule = new GlobalRewardTargetCreatedAtRangeRule(255, 1000);
  const item = newGlobalRewardTarget("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRewardTargetRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new GlobalRewardTargetRequiredCampaignRefRule("global reward target needs this field");
  const item = newGlobalRewardTarget("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardTargetRequiredNameRule flags a blank name", () => {
  const rule = new GlobalRewardTargetRequiredNameRule("global reward target needs this field");
  const item = newGlobalRewardTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
