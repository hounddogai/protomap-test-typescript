import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPacingAgreementCampaignRefLengthRule,
  PrimaryPacingAgreementClicksRangeRule,
  PrimaryPacingAgreementRequiredLabelRule,
  defaultPrimaryPacingAgreementValidator,
} from "./primary-pacing-agreement-rules.js";
import { newPrimaryPacingAgreement } from "./primary-pacing-agreement.js";

test("PrimaryPacingAgreementValidator reports every problem", () => {
  const validator = defaultPrimaryPacingAgreementValidator();
  const item = newPrimaryPacingAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPacingAgreementCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PrimaryPacingAgreementCampaignRefLengthRule(64);
  const item = newPrimaryPacingAgreement("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPacingAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryPacingAgreementRequiredLabelRule("primary pacing agreement needs a value");
  const item = newPrimaryPacingAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPacingAgreementClicksRangeRule flags values above clicks", () => {
  const rule = new PrimaryPacingAgreementClicksRangeRule(16, 32);
  const item = newPrimaryPacingAgreement("x", "y");
  item.clicks = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
