import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackEnrollmentAllocationLabelLengthRule,
  FallbackEnrollmentAllocationRequiredCountryRule,
  FallbackEnrollmentAllocationRequiredLabelRule,
  FallbackEnrollmentAllocationVersionRangeRule,
  defaultFallbackEnrollmentAllocationValidator,
} from "./fallback-enrollment-allocation-rules.js";
import { newFallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

test("FallbackEnrollmentAllocationValidator reports every problem", () => {
  const validator = defaultFallbackEnrollmentAllocationValidator();
  const item = newFallbackEnrollmentAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackEnrollmentAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackEnrollmentAllocationRequiredLabelRule("fallback enrollment allocation needs this field");
  const item = newFallbackEnrollmentAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackEnrollmentAllocationRequiredCountryRule flags a blank country", () => {
  const rule = new FallbackEnrollmentAllocationRequiredCountryRule("fallback enrollment allocation needs this field");
  const item = newFallbackEnrollmentAllocation("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackEnrollmentAllocationLabelLengthRule flags a long label", () => {
  const rule = new FallbackEnrollmentAllocationLabelLengthRule(3600);
  const item = newFallbackEnrollmentAllocation("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackEnrollmentAllocationVersionRangeRule flags values above version", () => {
  const rule = new FallbackEnrollmentAllocationVersionRangeRule(64, 3600);
  const item = newFallbackEnrollmentAllocation("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
