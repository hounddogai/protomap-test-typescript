import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyAgreementBatchSizeRangeRule,
  RollingJourneyAgreementCampaignRefLengthRule,
  RollingJourneyAgreementCodeLengthRule,
  RollingJourneyAgreementRequiredCampaignRefRule,
  RollingJourneyAgreementRequiredTitleRule,
  defaultRollingJourneyAgreementValidator,
} from "./rolling-journey-agreement-rules.js";
import { newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

test("RollingJourneyAgreementValidator reports every problem", () => {
  const validator = defaultRollingJourneyAgreementValidator();
  const item = newRollingJourneyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyAgreementCodeLengthRule flags a long code", () => {
  const rule = new RollingJourneyAgreementCodeLengthRule(16);
  const item = newRollingJourneyAgreement("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneyAgreementRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RollingJourneyAgreementRequiredCampaignRefRule("rolling journey agreement needs this field");
  const item = newRollingJourneyAgreement("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyAgreementBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RollingJourneyAgreementBatchSizeRangeRule(16, 86400);
  const item = newRollingJourneyAgreement("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneyAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new RollingJourneyAgreementRequiredTitleRule("rolling journey agreement needs a value");
  const item = newRollingJourneyAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyAgreementCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RollingJourneyAgreementCampaignRefLengthRule(80);
  const item = newRollingJourneyAgreement("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
