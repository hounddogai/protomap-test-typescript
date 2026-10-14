import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRedemptionPolicyCodeLengthRule,
  ScheduledRedemptionPolicyPhoneLengthRule,
  ScheduledRedemptionPolicyRequiredCampaignRefRule,
  ScheduledRedemptionPolicyRequiredCodeRule,
  defaultScheduledRedemptionPolicyValidator,
} from "./scheduled-redemption-policy-rules.js";
import { newScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

test("ScheduledRedemptionPolicyValidator reports every problem", () => {
  const validator = defaultScheduledRedemptionPolicyValidator();
  const item = newScheduledRedemptionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRedemptionPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledRedemptionPolicyRequiredCodeRule("scheduled redemption policy needs a value");
  const item = newScheduledRedemptionPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRedemptionPolicyCodeLengthRule flags a long code", () => {
  const rule = new ScheduledRedemptionPolicyCodeLengthRule(3600);
  const item = newScheduledRedemptionPolicy("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRedemptionPolicyRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledRedemptionPolicyRequiredCampaignRefRule("scheduled redemption policy needs an entry");
  const item = newScheduledRedemptionPolicy("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRedemptionPolicyPhoneLengthRule flags a long phone", () => {
  const rule = new ScheduledRedemptionPolicyPhoneLengthRule(80);
  const item = newScheduledRedemptionPolicy("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
