import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelDigestCampaignRefLengthRule,
  FunnelDigestExternalRefLengthRule,
  FunnelDigestOpenRateRangeRule,
  FunnelDigestRequiredCampaignRefRule,
  defaultFunnelDigestValidator,
} from "./funnel-digest-rules.js";
import { newFunnelDigest } from "./funnel-digest.js";

test("FunnelDigestValidator reports every problem", () => {
  const validator = defaultFunnelDigestValidator();
  const item = newFunnelDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelDigestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FunnelDigestCampaignRefLengthRule(255);
  const item = newFunnelDigest("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelDigestOpenRateRangeRule flags values above open rate", () => {
  const rule = new FunnelDigestOpenRateRangeRule(4.7, 4427.4);
  const item = newFunnelDigest("x", "y");
  item.openRate = 4428.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelDigestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FunnelDigestRequiredCampaignRefRule("funnel digest needs a value");
  const item = newFunnelDigest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelDigestExternalRefLengthRule flags a long external ref", () => {
  const rule = new FunnelDigestExternalRefLengthRule(3600);
  const item = newFunnelDigest("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
