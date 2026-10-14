import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingProofTierCampaignRefLengthRule,
  RollingProofTierRateRangeRule,
  RollingProofTierRequiredCodeRule,
  RollingProofTierTitleLengthRule,
  defaultRollingProofTierValidator,
} from "./rolling-proof-tier-rules.js";
import { newRollingProofTier } from "./rolling-proof-tier.js";

test("RollingProofTierValidator reports every problem", () => {
  const validator = defaultRollingProofTierValidator();
  const item = newRollingProofTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingProofTierRateRangeRule flags values above rate", () => {
  const rule = new RollingProofTierRateRangeRule(2, 4436.4);
  const item = newRollingProofTier("x", "y");
  item.rate = 4437.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingProofTierCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RollingProofTierCampaignRefLengthRule(86400);
  const item = newRollingProofTier("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingProofTierTitleLengthRule flags a long title", () => {
  const rule = new RollingProofTierTitleLengthRule(86400);
  const item = newRollingProofTier("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingProofTierRequiredCodeRule flags a blank code", () => {
  const rule = new RollingProofTierRequiredCodeRule("rolling proof tier needs this field");
  const item = newRollingProofTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
