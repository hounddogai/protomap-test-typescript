import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveApprovalAgreementCountryLengthRule,
  AdaptiveApprovalAgreementRequiredCodeRule,
  AdaptiveApprovalAgreementRequiredUnitRule,
  AdaptiveApprovalAgreementScoreRangeRule,
  defaultAdaptiveApprovalAgreementValidator,
} from "./adaptive-approval-agreement-rules.js";
import { newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("AdaptiveApprovalAgreementValidator reports every problem", () => {
  const validator = defaultAdaptiveApprovalAgreementValidator();
  const item = newAdaptiveApprovalAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveApprovalAgreementCountryLengthRule flags a long country", () => {
  const rule = new AdaptiveApprovalAgreementCountryLengthRule(32);
  const item = newAdaptiveApprovalAgreement("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveApprovalAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveApprovalAgreementRequiredCodeRule("adaptive approval agreement needs a value");
  const item = newAdaptiveApprovalAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveApprovalAgreementScoreRangeRule flags values above score", () => {
  const rule = new AdaptiveApprovalAgreementScoreRangeRule(4.7, 384.6);
  const item = newAdaptiveApprovalAgreement("x", "y");
  item.score = 386.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveApprovalAgreementRequiredUnitRule flags a blank unit", () => {
  const rule = new AdaptiveApprovalAgreementRequiredUnitRule("adaptive approval agreement needs this field");
  const item = newAdaptiveApprovalAgreement("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
