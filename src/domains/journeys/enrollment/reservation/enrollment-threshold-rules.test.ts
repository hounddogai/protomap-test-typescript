import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentThresholdCapacityRangeRule,
  EnrollmentThresholdNameLengthRule,
  EnrollmentThresholdRequiredCodeRule,
  defaultEnrollmentThresholdValidator,
} from "./enrollment-threshold-rules.js";
import { newEnrollmentThreshold } from "./enrollment-threshold.js";

test("EnrollmentThresholdValidator reports every problem", () => {
  const validator = defaultEnrollmentThresholdValidator();
  const item = newEnrollmentThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentThresholdRequiredCodeRule("enrollment threshold needs a value");
  const item = newEnrollmentThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentThresholdCapacityRangeRule flags values above capacity", () => {
  const rule = new EnrollmentThresholdCapacityRangeRule(255, 3600);
  const item = newEnrollmentThreshold("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentThresholdNameLengthRule flags a long name", () => {
  const rule = new EnrollmentThresholdNameLengthRule(1000);
  const item = newEnrollmentThreshold("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
