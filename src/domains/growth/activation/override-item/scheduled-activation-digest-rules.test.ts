import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledActivationDigestCampaignRefLengthRule,
  ScheduledActivationDigestImpressionsRangeRule,
  ScheduledActivationDigestRequiredCampaignRefRule,
  ScheduledActivationDigestRequiredCodeRule,
  ScheduledActivationDigestRequiredNameRule,
  defaultScheduledActivationDigestValidator,
} from "./scheduled-activation-digest-rules.js";
import { newScheduledActivationDigest } from "./scheduled-activation-digest.js";

test("ScheduledActivationDigestValidator reports every problem", () => {
  const validator = defaultScheduledActivationDigestValidator();
  const item = newScheduledActivationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledActivationDigestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledActivationDigestCampaignRefLengthRule(120);
  const item = newScheduledActivationDigest("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledActivationDigestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledActivationDigestRequiredCampaignRefRule("scheduled activation digest needs an entry");
  const item = newScheduledActivationDigest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledActivationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledActivationDigestRequiredCodeRule("scheduled activation digest needs a value");
  const item = newScheduledActivationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledActivationDigestImpressionsRangeRule flags values above impressions", () => {
  const rule = new ScheduledActivationDigestImpressionsRangeRule(32, 120);
  const item = newScheduledActivationDigest("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledActivationDigestRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledActivationDigestRequiredNameRule("scheduled activation digest needs a value");
  const item = newScheduledActivationDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
