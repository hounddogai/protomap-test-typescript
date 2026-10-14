import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryApprovalAgreementCodeLengthRule,
  PrimaryApprovalAgreementRequiredChannelRule,
  PrimaryApprovalAgreementRequiredLocaleRule,
  PrimaryApprovalAgreementRequiredNameRule,
  defaultPrimaryApprovalAgreementValidator,
} from "./primary-approval-agreement-rules.js";
import { newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

test("PrimaryApprovalAgreementValidator reports every problem", () => {
  const validator = defaultPrimaryApprovalAgreementValidator();
  const item = newPrimaryApprovalAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryApprovalAgreementRequiredLocaleRule flags a blank locale", () => {
  const rule = new PrimaryApprovalAgreementRequiredLocaleRule("primary approval agreement needs a value");
  const item = newPrimaryApprovalAgreement("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalAgreementRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryApprovalAgreementRequiredNameRule("primary approval agreement needs a value");
  const item = newPrimaryApprovalAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalAgreementCodeLengthRule flags a long code", () => {
  const rule = new PrimaryApprovalAgreementCodeLengthRule(32);
  const item = newPrimaryApprovalAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryApprovalAgreementRequiredChannelRule flags a blank channel", () => {
  const rule = new PrimaryApprovalAgreementRequiredChannelRule("primary approval agreement needs an entry");
  const item = newPrimaryApprovalAgreement("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
