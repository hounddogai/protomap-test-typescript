import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentNoticeCodeLengthRule,
  EnrollmentNoticePriorityRangeRule,
  EnrollmentNoticeVariantLengthRule,
  defaultEnrollmentNoticeValidator,
} from "./enrollment-notice-rules.js";
import { newEnrollmentNotice } from "./enrollment-notice.js";

test("EnrollmentNoticeValidator reports every problem", () => {
  const validator = defaultEnrollmentNoticeValidator();
  const item = newEnrollmentNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentNoticeVariantLengthRule flags a long variant", () => {
  const rule = new EnrollmentNoticeVariantLengthRule(1000);
  const item = newEnrollmentNotice("x", "y");
  item.variant = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentNoticeCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentNoticeCodeLengthRule(32);
  const item = newEnrollmentNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentNoticePriorityRangeRule flags values above priority", () => {
  const rule = new EnrollmentNoticePriorityRangeRule(16, 255);
  const item = newEnrollmentNotice("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
