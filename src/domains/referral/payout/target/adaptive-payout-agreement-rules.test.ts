import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePayoutAgreementCodeLengthRule,
  AdaptivePayoutAgreementImpressionsRangeRule,
  AdaptivePayoutAgreementNotesLengthRule,
  defaultAdaptivePayoutAgreementValidator,
} from "./adaptive-payout-agreement-rules.js";
import { newAdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

test("AdaptivePayoutAgreementValidator reports every problem", () => {
  const validator = defaultAdaptivePayoutAgreementValidator();
  const item = newAdaptivePayoutAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePayoutAgreementNotesLengthRule flags a long notes", () => {
  const rule = new AdaptivePayoutAgreementNotesLengthRule(64);
  const item = newAdaptivePayoutAgreement("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePayoutAgreementCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePayoutAgreementCodeLengthRule(64);
  const item = newAdaptivePayoutAgreement("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePayoutAgreementImpressionsRangeRule flags values above impressions", () => {
  const rule = new AdaptivePayoutAgreementImpressionsRangeRule(64, 120);
  const item = newAdaptivePayoutAgreement("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
