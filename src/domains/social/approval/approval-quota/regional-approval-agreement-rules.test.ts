import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalApprovalAgreementExternalRefLengthRule,
  RegionalApprovalAgreementRequiredExternalRefRule,
  RegionalApprovalAgreementRequiredLabelRule,
  RegionalApprovalAgreementSequenceRangeRule,
  defaultRegionalApprovalAgreementValidator,
} from "./regional-approval-agreement-rules.js";
import { newRegionalApprovalAgreement } from "./regional-approval-agreement.js";

test("RegionalApprovalAgreementValidator reports every problem", () => {
  const validator = defaultRegionalApprovalAgreementValidator();
  const item = newRegionalApprovalAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalApprovalAgreementSequenceRangeRule flags values above sequence", () => {
  const rule = new RegionalApprovalAgreementSequenceRangeRule(64, 86400);
  const item = newRegionalApprovalAgreement("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalApprovalAgreementExternalRefLengthRule flags a long external ref", () => {
  const rule = new RegionalApprovalAgreementExternalRefLengthRule(32);
  const item = newRegionalApprovalAgreement("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalApprovalAgreementRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RegionalApprovalAgreementRequiredExternalRefRule("regional approval agreement needs this field");
  const item = newRegionalApprovalAgreement("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalApprovalAgreementRequiredLabelRule("regional approval agreement needs this field");
  const item = newRegionalApprovalAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
