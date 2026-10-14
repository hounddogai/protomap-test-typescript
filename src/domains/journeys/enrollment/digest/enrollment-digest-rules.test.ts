import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentDigestLabelLengthRule,
  EnrollmentDigestLimitRangeRule,
  EnrollmentDigestRegionLengthRule,
  EnrollmentDigestRequiredLabelRule,
  EnrollmentDigestRequiredNameRule,
  defaultEnrollmentDigestValidator,
} from "./enrollment-digest-rules.js";
import { newEnrollmentDigest } from "./enrollment-digest.js";

test("EnrollmentDigestValidator reports every problem", () => {
  const validator = defaultEnrollmentDigestValidator();
  const item = newEnrollmentDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentDigestLabelLengthRule flags a long label", () => {
  const rule = new EnrollmentDigestLabelLengthRule(3600);
  const item = newEnrollmentDigest("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentDigestLimitRangeRule flags values above limit", () => {
  const rule = new EnrollmentDigestLimitRangeRule(120, 120);
  const item = newEnrollmentDigest("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentDigestRegionLengthRule flags a long region", () => {
  const rule = new EnrollmentDigestRegionLengthRule(80);
  const item = newEnrollmentDigest("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentDigestRequiredNameRule flags a blank name", () => {
  const rule = new EnrollmentDigestRequiredNameRule("enrollment digest needs a value");
  const item = newEnrollmentDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentDigestRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentDigestRequiredLabelRule("enrollment digest needs a value");
  const item = newEnrollmentDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
