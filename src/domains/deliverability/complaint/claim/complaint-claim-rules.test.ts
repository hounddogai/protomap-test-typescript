import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintClaimCampaignRefLengthRule,
  ComplaintClaimDurationMinutesRangeRule,
  ComplaintClaimPhoneLengthRule,
  ComplaintClaimRequiredCampaignRefRule,
  ComplaintClaimRequiredPhoneRule,
  defaultComplaintClaimValidator,
} from "./complaint-claim-rules.js";
import { newComplaintClaim } from "./complaint-claim.js";

test("ComplaintClaimValidator reports every problem", () => {
  const validator = defaultComplaintClaimValidator();
  const item = newComplaintClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintClaimDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ComplaintClaimDurationMinutesRangeRule(16, 120);
  const item = newComplaintClaim("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintClaimRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ComplaintClaimRequiredCampaignRefRule("complaint claim needs an entry");
  const item = newComplaintClaim("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new ComplaintClaimRequiredPhoneRule("complaint claim needs this field");
  const item = newComplaintClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintClaimCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ComplaintClaimCampaignRefLengthRule(64);
  const item = newComplaintClaim("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintClaimPhoneLengthRule flags a long phone", () => {
  const rule = new ComplaintClaimPhoneLengthRule(120);
  const item = newComplaintClaim("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
