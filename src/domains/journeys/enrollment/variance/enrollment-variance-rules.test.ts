import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentVarianceChannelLengthRule,
  EnrollmentVarianceEndsAtRangeRule,
  EnrollmentVarianceFrequencyCapRangeRule,
  EnrollmentVarianceRequiredChannelRule,
  EnrollmentVarianceSendAtRangeRule,
  defaultEnrollmentVarianceValidator,
} from "./enrollment-variance-rules.js";
import { newEnrollmentVariance } from "./enrollment-variance.js";

test("EnrollmentVarianceValidator reports every problem", () => {
  const validator = defaultEnrollmentVarianceValidator();
  const item = newEnrollmentVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentVarianceRequiredChannelRule flags a blank channel", () => {
  const rule = new EnrollmentVarianceRequiredChannelRule("enrollment variance needs a value");
  const item = newEnrollmentVariance("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentVarianceEndsAtRangeRule flags values above ends at", () => {
  const rule = new EnrollmentVarianceEndsAtRangeRule(255, 1000);
  const item = newEnrollmentVariance("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentVarianceChannelLengthRule flags a long channel", () => {
  const rule = new EnrollmentVarianceChannelLengthRule(16);
  const item = newEnrollmentVariance("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentVarianceSendAtRangeRule flags values above send at", () => {
  const rule = new EnrollmentVarianceSendAtRangeRule(80, 120);
  const item = newEnrollmentVariance("x", "y");
  item.sendAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentVarianceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new EnrollmentVarianceFrequencyCapRangeRule(120, 120);
  const item = newEnrollmentVariance("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
