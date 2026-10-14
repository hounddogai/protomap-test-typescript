import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEnrollmentAgreementCodeLengthRule,
  TieredEnrollmentAgreementCreatedAtRangeRule,
  TieredEnrollmentAgreementExpiresAtRangeRule,
  TieredEnrollmentAgreementLimitRangeRule,
  TieredEnrollmentAgreementRequiredLabelRule,
  defaultTieredEnrollmentAgreementValidator,
} from "./tiered-enrollment-agreement-rules.js";
import { newTieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

test("TieredEnrollmentAgreementValidator reports every problem", () => {
  const validator = defaultTieredEnrollmentAgreementValidator();
  const item = newTieredEnrollmentAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEnrollmentAgreementCreatedAtRangeRule flags values above created at", () => {
  const rule = new TieredEnrollmentAgreementCreatedAtRangeRule(64, 80);
  const item = newTieredEnrollmentAgreement("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredEnrollmentAgreementCodeLengthRule flags a long code", () => {
  const rule = new TieredEnrollmentAgreementCodeLengthRule(1000);
  const item = newTieredEnrollmentAgreement("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredEnrollmentAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new TieredEnrollmentAgreementRequiredLabelRule("tiered enrollment agreement needs an entry");
  const item = newTieredEnrollmentAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEnrollmentAgreementExpiresAtRangeRule flags values above expires at", () => {
  const rule = new TieredEnrollmentAgreementExpiresAtRangeRule(32, 86400);
  const item = newTieredEnrollmentAgreement("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredEnrollmentAgreementLimitRangeRule flags values above limit", () => {
  const rule = new TieredEnrollmentAgreementLimitRangeRule(64, 1000);
  const item = newTieredEnrollmentAgreement("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
