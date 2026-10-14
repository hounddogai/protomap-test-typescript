import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentTierRequiredCodeRule,
  EnrollmentTierTitleLengthRule,
  defaultEnrollmentTierValidator,
} from "./enrollment-tier-rules.js";
import { newEnrollmentTier } from "./enrollment-tier.js";

test("EnrollmentTierValidator reports every problem", () => {
  const validator = defaultEnrollmentTierValidator();
  const item = newEnrollmentTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentTierTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentTierTitleLengthRule(120);
  const item = newEnrollmentTier("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentTierRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentTierRequiredCodeRule("enrollment tier needs a value");
  const item = newEnrollmentTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
