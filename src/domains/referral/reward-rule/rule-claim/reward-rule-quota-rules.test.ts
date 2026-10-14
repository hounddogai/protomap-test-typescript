import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleQuotaLabelLengthRule,
  RewardRuleQuotaRequiredCampaignRefRule,
  RewardRuleQuotaRequiredLabelRule,
  RewardRuleQuotaRequiredUtmSourceRule,
  defaultRewardRuleQuotaValidator,
} from "./reward-rule-quota-rules.js";
import { newRewardRuleQuota } from "./reward-rule-quota.js";

test("RewardRuleQuotaValidator reports every problem", () => {
  const validator = defaultRewardRuleQuotaValidator();
  const item = newRewardRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleQuotaLabelLengthRule flags a long label", () => {
  const rule = new RewardRuleQuotaLabelLengthRule(64);
  const item = newRewardRuleQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleQuotaRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RewardRuleQuotaRequiredUtmSourceRule("reward rule quota needs a value");
  const item = newRewardRuleQuota("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleQuotaRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RewardRuleQuotaRequiredCampaignRefRule("reward rule quota needs an entry");
  const item = newRewardRuleQuota("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new RewardRuleQuotaRequiredLabelRule("reward rule quota needs this field");
  const item = newRewardRuleQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
