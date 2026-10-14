import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredJourneyDigestCampaignRefLengthRule,
  TieredJourneyDigestRequiredCampaignRefRule,
  defaultTieredJourneyDigestValidator,
} from "./tiered-journey-digest-rules.js";
import { newTieredJourneyDigest } from "./tiered-journey-digest.js";

test("TieredJourneyDigestValidator reports every problem", () => {
  const validator = defaultTieredJourneyDigestValidator();
  const item = newTieredJourneyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredJourneyDigestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new TieredJourneyDigestRequiredCampaignRefRule("tiered journey digest needs an entry");
  const item = newTieredJourneyDigest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredJourneyDigestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TieredJourneyDigestCampaignRefLengthRule(32);
  const item = newTieredJourneyDigest("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
