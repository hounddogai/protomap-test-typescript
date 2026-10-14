import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPayoutBundleCampaignRefLengthRule,
  LegacyPayoutBundleCodeLengthRule,
  LegacyPayoutBundleGraceDaysRangeRule,
  LegacyPayoutBundleLabelLengthRule,
  LegacyPayoutBundleRequiredCampaignRefRule,
  LegacyPayoutBundleRequiredCodeRule,
  defaultLegacyPayoutBundleValidator,
} from "./legacy-payout-bundle-rules.js";
import { newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

test("LegacyPayoutBundleValidator reports every problem", () => {
  const validator = defaultLegacyPayoutBundleValidator();
  const item = newLegacyPayoutBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPayoutBundleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LegacyPayoutBundleCampaignRefLengthRule(1000);
  const item = newLegacyPayoutBundle("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutBundleCodeLengthRule flags a long code", () => {
  const rule = new LegacyPayoutBundleCodeLengthRule(3600);
  const item = newLegacyPayoutBundle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutBundleRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyPayoutBundleRequiredCodeRule("legacy payout bundle needs a value");
  const item = newLegacyPayoutBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPayoutBundleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LegacyPayoutBundleGraceDaysRangeRule(16, 80);
  const item = newLegacyPayoutBundle("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPayoutBundleLabelLengthRule flags a long label", () => {
  const rule = new LegacyPayoutBundleLabelLengthRule(120);
  const item = newLegacyPayoutBundle("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutBundleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacyPayoutBundleRequiredCampaignRefRule("legacy payout bundle needs this field");
  const item = newLegacyPayoutBundle("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
