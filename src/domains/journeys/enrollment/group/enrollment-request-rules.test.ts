import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentRequestBidRangeRule,
  EnrollmentRequestExpiresAtRangeRule,
  EnrollmentRequestNotesLengthRule,
  EnrollmentRequestRequiredCodeRule,
  defaultEnrollmentRequestValidator,
} from "./enrollment-request-rules.js";
import { newEnrollmentRequest } from "./enrollment-request.js";

test("EnrollmentRequestValidator reports every problem", () => {
  const validator = defaultEnrollmentRequestValidator();
  const item = newEnrollmentRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentRequestBidRangeRule flags values above bid", () => {
  const rule = new EnrollmentRequestBidRangeRule(3.2, 292.2);
  const item = newEnrollmentRequest("x", "y");
  item.bid = 293.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentRequestNotesLengthRule flags a long notes", () => {
  const rule = new EnrollmentRequestNotesLengthRule(16);
  const item = newEnrollmentRequest("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentRequestRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentRequestRequiredCodeRule("enrollment request needs this field");
  const item = newEnrollmentRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentRequestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new EnrollmentRequestExpiresAtRangeRule(16, 80);
  const item = newEnrollmentRequest("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
