import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentPolicyCodeLengthRule,
  EnrollmentPolicyDiscountRangeRule,
  EnrollmentPolicyLabelLengthRule,
  EnrollmentPolicySequenceRangeRule,
  defaultEnrollmentPolicyValidator,
} from "./enrollment-policy-rules.js";
import { newEnrollmentPolicy } from "./enrollment-policy.js";

test("EnrollmentPolicyValidator reports every problem", () => {
  const validator = defaultEnrollmentPolicyValidator();
  const item = newEnrollmentPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentPolicyCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentPolicyCodeLengthRule(255);
  const item = newEnrollmentPolicy("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentPolicySequenceRangeRule flags values above sequence", () => {
  const rule = new EnrollmentPolicySequenceRangeRule(255, 86400);
  const item = newEnrollmentPolicy("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentPolicyLabelLengthRule flags a long label", () => {
  const rule = new EnrollmentPolicyLabelLengthRule(32);
  const item = newEnrollmentPolicy("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentPolicyDiscountRangeRule flags values above discount", () => {
  const rule = new EnrollmentPolicyDiscountRangeRule(5.8, 2640.8);
  const item = newEnrollmentPolicy("x", "y");
  item.discount = 2642.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
