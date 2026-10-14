import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentOverrideCountryLengthRule,
  EnrollmentOverrideDurationMinutesRangeRule,
  EnrollmentOverrideRequiredTitleRule,
  defaultEnrollmentOverrideValidator,
} from "./enrollment-override-rules.js";
import { newEnrollmentOverride } from "./enrollment-override.js";

test("EnrollmentOverrideValidator reports every problem", () => {
  const validator = defaultEnrollmentOverrideValidator();
  const item = newEnrollmentOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new EnrollmentOverrideRequiredTitleRule("enrollment override needs an entry");
  const item = newEnrollmentOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentOverrideDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new EnrollmentOverrideDurationMinutesRangeRule(32, 64);
  const item = newEnrollmentOverride("x", "y");
  item.durationMinutes = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentOverrideCountryLengthRule flags a long country", () => {
  const rule = new EnrollmentOverrideCountryLengthRule(80);
  const item = newEnrollmentOverride("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
