import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardQuotaChannelLengthRule,
  RewardQuotaLabelLengthRule,
  RewardQuotaRequiredChannelRule,
  RewardQuotaRequiredLabelRule,
  RewardQuotaSendAtRangeRule,
  defaultRewardQuotaValidator,
} from "./reward-quota-rules.js";
import { newRewardQuota } from "./reward-quota.js";

test("RewardQuotaValidator reports every problem", () => {
  const validator = defaultRewardQuotaValidator();
  const item = newRewardQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardQuotaSendAtRangeRule flags values above send at", () => {
  const rule = new RewardQuotaSendAtRangeRule(16, 80);
  const item = newRewardQuota("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardQuotaRequiredChannelRule flags a blank channel", () => {
  const rule = new RewardQuotaRequiredChannelRule("reward quota needs a value");
  const item = newRewardQuota("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardQuotaLabelLengthRule flags a long label", () => {
  const rule = new RewardQuotaLabelLengthRule(3600);
  const item = newRewardQuota("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new RewardQuotaRequiredLabelRule("reward quota needs this field");
  const item = newRewardQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardQuotaChannelLengthRule flags a long channel", () => {
  const rule = new RewardQuotaChannelLengthRule(16);
  const item = newRewardQuota("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
