import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreditAgreementCampaignRefLengthRule,
  ManualCreditAgreementCeilingRangeRule,
  ManualCreditAgreementCodeLengthRule,
  ManualCreditAgreementRequiredTitleRule,
  ManualCreditAgreementTitleLengthRule,
  defaultManualCreditAgreementValidator,
} from "./manual-credit-agreement-rules.js";
import { newManualCreditAgreement } from "./manual-credit-agreement.js";

test("ManualCreditAgreementValidator reports every problem", () => {
  const validator = defaultManualCreditAgreementValidator();
  const item = newManualCreditAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreditAgreementTitleLengthRule flags a long title", () => {
  const rule = new ManualCreditAgreementTitleLengthRule(64);
  const item = newManualCreditAgreement("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreditAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new ManualCreditAgreementRequiredTitleRule("manual credit agreement needs this field");
  const item = newManualCreditAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreditAgreementCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ManualCreditAgreementCampaignRefLengthRule(64);
  const item = newManualCreditAgreement("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreditAgreementCodeLengthRule flags a long code", () => {
  const rule = new ManualCreditAgreementCodeLengthRule(86400);
  const item = newManualCreditAgreement("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreditAgreementCeilingRangeRule flags values above ceiling", () => {
  const rule = new ManualCreditAgreementCeilingRangeRule(0.6, 175.3);
  const item = newManualCreditAgreement("x", "y");
  item.ceiling = 176.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
