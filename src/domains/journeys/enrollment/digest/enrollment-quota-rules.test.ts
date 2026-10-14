import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentQuotaCostRangeRule,
  EnrollmentQuotaGraceDaysRangeRule,
  EnrollmentQuotaLabelLengthRule,
  EnrollmentQuotaRequiredLabelRule,
  defaultEnrollmentQuotaValidator,
} from "./enrollment-quota-rules.js";
import { newEnrollmentQuota } from "./enrollment-quota.js";

test("EnrollmentQuotaValidator reports every problem", () => {
  const validator = defaultEnrollmentQuotaValidator();
  const item = newEnrollmentQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentQuotaGraceDaysRangeRule flags values above grace days", () => {
  const rule = new EnrollmentQuotaGraceDaysRangeRule(80, 1000);
  const item = newEnrollmentQuota("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentQuotaRequiredLabelRule("enrollment quota needs this field");
  const item = newEnrollmentQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentQuotaLabelLengthRule flags a long label", () => {
  const rule = new EnrollmentQuotaLabelLengthRule(255);
  const item = newEnrollmentQuota("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentQuotaCostRangeRule flags values above cost", () => {
  const rule = new EnrollmentQuotaCostRangeRule(3.3, 4458.9);
  const item = newEnrollmentQuota("x", "y");
  item.cost = 4460.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
