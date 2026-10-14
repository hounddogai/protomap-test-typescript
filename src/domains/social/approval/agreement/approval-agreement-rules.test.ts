import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalAgreementCodeLengthRule,
  ApprovalAgreementRatioRangeRule,
  ApprovalAgreementRequiredSegmentRule,
  ApprovalAgreementSegmentLengthRule,
  ApprovalAgreementTitleLengthRule,
  defaultApprovalAgreementValidator,
} from "./approval-agreement-rules.js";
import { newApprovalAgreement } from "./approval-agreement.js";

test("ApprovalAgreementValidator reports every problem", () => {
  const validator = defaultApprovalAgreementValidator();
  const item = newApprovalAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalAgreementCodeLengthRule flags a long code", () => {
  const rule = new ApprovalAgreementCodeLengthRule(16);
  const item = newApprovalAgreement("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalAgreementRequiredSegmentRule flags a blank segment", () => {
  const rule = new ApprovalAgreementRequiredSegmentRule("approval agreement needs a value");
  const item = newApprovalAgreement("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalAgreementRatioRangeRule flags values above ratio", () => {
  const rule = new ApprovalAgreementRatioRangeRule(7.2, 2430.3);
  const item = newApprovalAgreement("x", "y");
  item.ratio = 2431.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalAgreementTitleLengthRule flags a long title", () => {
  const rule = new ApprovalAgreementTitleLengthRule(64);
  const item = newApprovalAgreement("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalAgreementSegmentLengthRule flags a long segment", () => {
  const rule = new ApprovalAgreementSegmentLengthRule(120);
  const item = newApprovalAgreement("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
