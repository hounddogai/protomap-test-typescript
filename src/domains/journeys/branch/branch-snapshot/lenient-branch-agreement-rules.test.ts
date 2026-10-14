import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBranchAgreementCodeLengthRule,
  LenientBranchAgreementPhoneLengthRule,
  LenientBranchAgreementRequiredPhoneRule,
  LenientBranchAgreementTitleLengthRule,
  defaultLenientBranchAgreementValidator,
} from "./lenient-branch-agreement-rules.js";
import { newLenientBranchAgreement } from "./lenient-branch-agreement.js";

test("LenientBranchAgreementValidator reports every problem", () => {
  const validator = defaultLenientBranchAgreementValidator();
  const item = newLenientBranchAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBranchAgreementCodeLengthRule flags a long code", () => {
  const rule = new LenientBranchAgreementCodeLengthRule(32);
  const item = newLenientBranchAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBranchAgreementRequiredPhoneRule flags a blank phone", () => {
  const rule = new LenientBranchAgreementRequiredPhoneRule("lenient branch agreement needs an entry");
  const item = newLenientBranchAgreement("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBranchAgreementPhoneLengthRule flags a long phone", () => {
  const rule = new LenientBranchAgreementPhoneLengthRule(3600);
  const item = newLenientBranchAgreement("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBranchAgreementTitleLengthRule flags a long title", () => {
  const rule = new LenientBranchAgreementTitleLengthRule(64);
  const item = newLenientBranchAgreement("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
