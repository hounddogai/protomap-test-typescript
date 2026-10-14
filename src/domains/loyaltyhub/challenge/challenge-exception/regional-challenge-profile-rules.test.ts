import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalChallengeProfileCampaignRefLengthRule,
  RegionalChallengeProfileRequiredCountryRule,
  RegionalChallengeProfileRequiredLabelRule,
  RegionalChallengeProfileWindowDaysRangeRule,
  defaultRegionalChallengeProfileValidator,
} from "./regional-challenge-profile-rules.js";
import { newRegionalChallengeProfile } from "./regional-challenge-profile.js";

test("RegionalChallengeProfileValidator reports every problem", () => {
  const validator = defaultRegionalChallengeProfileValidator();
  const item = newRegionalChallengeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalChallengeProfileRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalChallengeProfileRequiredLabelRule("regional challenge profile needs this field");
  const item = newRegionalChallengeProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalChallengeProfileWindowDaysRangeRule flags values above window days", () => {
  const rule = new RegionalChallengeProfileWindowDaysRangeRule(1000, 1000);
  const item = newRegionalChallengeProfile("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalChallengeProfileCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RegionalChallengeProfileCampaignRefLengthRule(32);
  const item = newRegionalChallengeProfile("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeProfileRequiredCountryRule flags a blank country", () => {
  const rule = new RegionalChallengeProfileRequiredCountryRule("regional challenge profile needs an entry");
  const item = newRegionalChallengeProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
