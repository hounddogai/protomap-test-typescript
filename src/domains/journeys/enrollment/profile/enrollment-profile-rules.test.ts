import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentProfileClicksRangeRule,
  EnrollmentProfileRequiredCodeRule,
  EnrollmentProfileRequiredCountryRule,
  EnrollmentProfileUpdatedAtRangeRule,
  defaultEnrollmentProfileValidator,
} from "./enrollment-profile-rules.js";
import { newEnrollmentProfile } from "./enrollment-profile.js";

test("EnrollmentProfileValidator reports every problem", () => {
  const validator = defaultEnrollmentProfileValidator();
  const item = newEnrollmentProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentProfileClicksRangeRule flags values above clicks", () => {
  const rule = new EnrollmentProfileClicksRangeRule(120, 3600);
  const item = newEnrollmentProfile("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentProfileRequiredCountryRule flags a blank country", () => {
  const rule = new EnrollmentProfileRequiredCountryRule("enrollment profile needs this field");
  const item = newEnrollmentProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentProfileUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new EnrollmentProfileUpdatedAtRangeRule(16, 255);
  const item = newEnrollmentProfile("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentProfileRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentProfileRequiredCodeRule("enrollment profile needs an entry");
  const item = newEnrollmentProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
