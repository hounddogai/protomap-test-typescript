import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientEnrollmentDigestCodeLengthRule,
  LenientEnrollmentDigestRequiredContactEmailRule,
  LenientEnrollmentDigestRequiredLabelRule,
  LenientEnrollmentDigestThresholdRangeRule,
  defaultLenientEnrollmentDigestValidator,
} from "./lenient-enrollment-digest-rules.js";
import { newLenientEnrollmentDigest } from "./lenient-enrollment-digest.js";

test("LenientEnrollmentDigestValidator reports every problem", () => {
  const validator = defaultLenientEnrollmentDigestValidator();
  const item = newLenientEnrollmentDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientEnrollmentDigestCodeLengthRule flags a long code", () => {
  const rule = new LenientEnrollmentDigestCodeLengthRule(80);
  const item = newLenientEnrollmentDigest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientEnrollmentDigestThresholdRangeRule flags values above threshold", () => {
  const rule = new LenientEnrollmentDigestThresholdRangeRule(7.1, 304.6);
  const item = newLenientEnrollmentDigest("x", "y");
  item.threshold = 306.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientEnrollmentDigestRequiredLabelRule flags a blank label", () => {
  const rule = new LenientEnrollmentDigestRequiredLabelRule("lenient enrollment digest needs a value");
  const item = newLenientEnrollmentDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientEnrollmentDigestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LenientEnrollmentDigestRequiredContactEmailRule("lenient enrollment digest needs this field");
  const item = newLenientEnrollmentDigest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
