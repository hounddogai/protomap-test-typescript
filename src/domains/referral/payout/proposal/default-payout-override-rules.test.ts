import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPayoutOverrideAudienceIdLengthRule,
  DefaultPayoutOverrideCampaignRefLengthRule,
  DefaultPayoutOverrideCreatedAtRangeRule,
  defaultDefaultPayoutOverrideValidator,
} from "./default-payout-override-rules.js";
import { newDefaultPayoutOverride } from "./default-payout-override.js";

test("DefaultPayoutOverrideValidator reports every problem", () => {
  const validator = defaultDefaultPayoutOverrideValidator();
  const item = newDefaultPayoutOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPayoutOverrideCreatedAtRangeRule flags values above created at", () => {
  const rule = new DefaultPayoutOverrideCreatedAtRangeRule(32, 86400);
  const item = newDefaultPayoutOverride("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPayoutOverrideAudienceIdLengthRule flags a long audience id", () => {
  const rule = new DefaultPayoutOverrideAudienceIdLengthRule(64);
  const item = newDefaultPayoutOverride("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPayoutOverrideCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DefaultPayoutOverrideCampaignRefLengthRule(80);
  const item = newDefaultPayoutOverride("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
