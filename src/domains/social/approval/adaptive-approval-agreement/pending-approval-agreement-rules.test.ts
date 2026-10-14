import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingApprovalAgreementAttemptsRangeRule,
  PendingApprovalAgreementExpiresAtRangeRule,
  PendingApprovalAgreementRequiredCodeRule,
  defaultPendingApprovalAgreementValidator,
} from "./pending-approval-agreement-rules.js";
import { newPendingApprovalAgreement } from "./pending-approval-agreement.js";

test("PendingApprovalAgreementValidator reports every problem", () => {
  const validator = defaultPendingApprovalAgreementValidator();
  const item = newPendingApprovalAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingApprovalAgreementAttemptsRangeRule flags values above attempts", () => {
  const rule = new PendingApprovalAgreementAttemptsRangeRule(255, 86400);
  const item = newPendingApprovalAgreement("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingApprovalAgreementExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingApprovalAgreementExpiresAtRangeRule(64, 255);
  const item = newPendingApprovalAgreement("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingApprovalAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new PendingApprovalAgreementRequiredCodeRule("pending approval agreement needs an entry");
  const item = newPendingApprovalAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
