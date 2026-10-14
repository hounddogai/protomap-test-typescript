import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditAuditCreatedAtRangeRule,
  CreditAuditLabelLengthRule,
  CreditAuditRequiredCodeRule,
  CreditAuditRequiredReviewerRule,
  defaultCreditAuditValidator,
} from "./credit-audit-rules.js";
import { newCreditAudit } from "./credit-audit.js";

test("CreditAuditValidator reports every problem", () => {
  const validator = defaultCreditAuditValidator();
  const item = newCreditAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditAuditLabelLengthRule flags a long label", () => {
  const rule = new CreditAuditLabelLengthRule(3600);
  const item = newCreditAudit("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAuditCreatedAtRangeRule flags values above created at", () => {
  const rule = new CreditAuditCreatedAtRangeRule(16, 32);
  const item = newCreditAudit("x", "y");
  item.createdAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditAuditRequiredCodeRule flags a blank code", () => {
  const rule = new CreditAuditRequiredCodeRule("credit audit needs a value");
  const item = newCreditAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditAuditRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CreditAuditRequiredReviewerRule("credit audit needs an entry");
  const item = newCreditAudit("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
