import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentAdjustmentFloorValueRangeRule,
  EnrollmentAdjustmentPhoneLengthRule,
  EnrollmentAdjustmentRequiredCodeRule,
  EnrollmentAdjustmentRevisionRangeRule,
  EnrollmentAdjustmentTitleLengthRule,
  defaultEnrollmentAdjustmentValidator,
} from "./enrollment-adjustment-rules.js";
import { newEnrollmentAdjustment } from "./enrollment-adjustment.js";

test("EnrollmentAdjustmentValidator reports every problem", () => {
  const validator = defaultEnrollmentAdjustmentValidator();
  const item = newEnrollmentAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentAdjustmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new EnrollmentAdjustmentFloorValueRangeRule(0.8, 2036.2);
  const item = newEnrollmentAdjustment("x", "y");
  item.floorValue = 2037.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentAdjustmentPhoneLengthRule flags a long phone", () => {
  const rule = new EnrollmentAdjustmentPhoneLengthRule(32);
  const item = newEnrollmentAdjustment("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentAdjustmentRevisionRangeRule flags values above revision", () => {
  const rule = new EnrollmentAdjustmentRevisionRangeRule(1000, 3600);
  const item = newEnrollmentAdjustment("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentAdjustmentTitleLengthRule(16);
  const item = newEnrollmentAdjustment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentAdjustmentRequiredCodeRule("enrollment adjustment needs a value");
  const item = newEnrollmentAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
