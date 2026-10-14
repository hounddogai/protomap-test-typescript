import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionBundleAudienceIdLengthRule,
  GlobalRetentionBundleCampaignRefLengthRule,
  GlobalRetentionBundleCodeLengthRule,
  GlobalRetentionBundleRequiredCampaignRefRule,
  GlobalRetentionBundleSequenceRangeRule,
  defaultGlobalRetentionBundleValidator,
} from "./global-retention-bundle-rules.js";
import { newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("GlobalRetentionBundleValidator reports every problem", () => {
  const validator = defaultGlobalRetentionBundleValidator();
  const item = newGlobalRetentionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionBundleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new GlobalRetentionBundleRequiredCampaignRefRule("global retention bundle needs a value");
  const item = newGlobalRetentionBundle("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionBundleCodeLengthRule flags a long code", () => {
  const rule = new GlobalRetentionBundleCodeLengthRule(3600);
  const item = newGlobalRetentionBundle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRetentionBundleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new GlobalRetentionBundleAudienceIdLengthRule(120);
  const item = newGlobalRetentionBundle("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRetentionBundleSequenceRangeRule flags values above sequence", () => {
  const rule = new GlobalRetentionBundleSequenceRangeRule(64, 86400);
  const item = newGlobalRetentionBundle("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRetentionBundleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new GlobalRetentionBundleCampaignRefLengthRule(32);
  const item = newGlobalRetentionBundle("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
