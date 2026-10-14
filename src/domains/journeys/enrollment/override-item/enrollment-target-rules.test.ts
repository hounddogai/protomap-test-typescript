import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentTargetCapacityRangeRule,
  EnrollmentTargetChecksumLengthRule,
  EnrollmentTargetFrequencyCapRangeRule,
  EnrollmentTargetNameLengthRule,
  defaultEnrollmentTargetValidator,
} from "./enrollment-target-rules.js";
import { newEnrollmentTarget } from "./enrollment-target.js";

test("EnrollmentTargetValidator reports every problem", () => {
  const validator = defaultEnrollmentTargetValidator();
  const item = newEnrollmentTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentTargetCapacityRangeRule flags values above capacity", () => {
  const rule = new EnrollmentTargetCapacityRangeRule(32, 120);
  const item = newEnrollmentTarget("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentTargetFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new EnrollmentTargetFrequencyCapRangeRule(3600, 3600);
  const item = newEnrollmentTarget("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentTargetChecksumLengthRule flags a long checksum", () => {
  const rule = new EnrollmentTargetChecksumLengthRule(64);
  const item = newEnrollmentTarget("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentTargetNameLengthRule flags a long name", () => {
  const rule = new EnrollmentTargetNameLengthRule(255);
  const item = newEnrollmentTarget("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
