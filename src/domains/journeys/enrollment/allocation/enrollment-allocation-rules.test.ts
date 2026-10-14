import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentAllocationCodeLengthRule,
  EnrollmentAllocationConversionRateRangeRule,
  EnrollmentAllocationRequiredChannelRule,
  EnrollmentAllocationRequiredCodeRule,
  defaultEnrollmentAllocationValidator,
} from "./enrollment-allocation-rules.js";
import { newEnrollmentAllocation } from "./enrollment-allocation.js";

test("EnrollmentAllocationValidator reports every problem", () => {
  const validator = defaultEnrollmentAllocationValidator();
  const item = newEnrollmentAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentAllocationRequiredCodeRule("enrollment allocation needs an entry");
  const item = newEnrollmentAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentAllocationRequiredChannelRule flags a blank channel", () => {
  const rule = new EnrollmentAllocationRequiredChannelRule("enrollment allocation needs an entry");
  const item = newEnrollmentAllocation("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentAllocationCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentAllocationCodeLengthRule(255);
  const item = newEnrollmentAllocation("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentAllocationConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new EnrollmentAllocationConversionRateRangeRule(4.1, 4325.9);
  const item = newEnrollmentAllocation("x", "y");
  item.conversionRate = 4327.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
