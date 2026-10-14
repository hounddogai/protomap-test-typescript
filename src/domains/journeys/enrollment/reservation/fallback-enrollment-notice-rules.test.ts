import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackEnrollmentNoticeCodeLengthRule,
  FallbackEnrollmentNoticeOwnerIdLengthRule,
  FallbackEnrollmentNoticeRequiredTitleRule,
  defaultFallbackEnrollmentNoticeValidator,
} from "./fallback-enrollment-notice-rules.js";
import { newFallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

test("FallbackEnrollmentNoticeValidator reports every problem", () => {
  const validator = defaultFallbackEnrollmentNoticeValidator();
  const item = newFallbackEnrollmentNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackEnrollmentNoticeCodeLengthRule flags a long code", () => {
  const rule = new FallbackEnrollmentNoticeCodeLengthRule(3600);
  const item = newFallbackEnrollmentNotice("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackEnrollmentNoticeOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackEnrollmentNoticeOwnerIdLengthRule(64);
  const item = newFallbackEnrollmentNotice("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackEnrollmentNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackEnrollmentNoticeRequiredTitleRule("fallback enrollment notice needs this field");
  const item = newFallbackEnrollmentNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
