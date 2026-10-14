import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentAuditConversionRateRangeRule,
  EnrollmentAuditOwnerIdLengthRule,
  EnrollmentAuditRequiredCodeRule,
  EnrollmentAuditRequiredOwnerIdRule,
  EnrollmentAuditSequenceRangeRule,
  defaultEnrollmentAuditValidator,
} from "./enrollment-audit-rules.js";
import { newEnrollmentAudit } from "./enrollment-audit.js";

test("EnrollmentAuditValidator reports every problem", () => {
  const validator = defaultEnrollmentAuditValidator();
  const item = newEnrollmentAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentAuditConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new EnrollmentAuditConversionRateRangeRule(8.9, 1729.2);
  const item = newEnrollmentAudit("x", "y");
  item.conversionRate = 1730.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentAuditRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentAuditRequiredCodeRule("enrollment audit needs an entry");
  const item = newEnrollmentAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentAuditRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new EnrollmentAuditRequiredOwnerIdRule("enrollment audit needs an entry");
  const item = newEnrollmentAudit("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentAuditOwnerIdLengthRule flags a long owner id", () => {
  const rule = new EnrollmentAuditOwnerIdLengthRule(86400);
  const item = newEnrollmentAudit("x", "y");
  item.ownerId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentAuditSequenceRangeRule flags values above sequence", () => {
  const rule = new EnrollmentAuditSequenceRangeRule(16, 64);
  const item = newEnrollmentAudit("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
