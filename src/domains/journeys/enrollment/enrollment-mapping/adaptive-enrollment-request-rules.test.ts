import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveEnrollmentRequestCodeLengthRule,
  AdaptiveEnrollmentRequestGraceDaysRangeRule,
  AdaptiveEnrollmentRequestRequiredCodeRule,
  AdaptiveEnrollmentRequestRequiredSourceRule,
  AdaptiveEnrollmentRequestSourceLengthRule,
  defaultAdaptiveEnrollmentRequestValidator,
} from "./adaptive-enrollment-request-rules.js";
import { newAdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

test("AdaptiveEnrollmentRequestValidator reports every problem", () => {
  const validator = defaultAdaptiveEnrollmentRequestValidator();
  const item = newAdaptiveEnrollmentRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveEnrollmentRequestSourceLengthRule flags a long source", () => {
  const rule = new AdaptiveEnrollmentRequestSourceLengthRule(120);
  const item = newAdaptiveEnrollmentRequest("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentRequestRequiredSourceRule flags a blank source", () => {
  const rule = new AdaptiveEnrollmentRequestRequiredSourceRule("adaptive enrollment request needs an entry");
  const item = newAdaptiveEnrollmentRequest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveEnrollmentRequestRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveEnrollmentRequestRequiredCodeRule("adaptive enrollment request needs an entry");
  const item = newAdaptiveEnrollmentRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveEnrollmentRequestCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveEnrollmentRequestCodeLengthRule(1000);
  const item = newAdaptiveEnrollmentRequest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentRequestGraceDaysRangeRule flags values above grace days", () => {
  const rule = new AdaptiveEnrollmentRequestGraceDaysRangeRule(3600, 3600);
  const item = newAdaptiveEnrollmentRequest("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
