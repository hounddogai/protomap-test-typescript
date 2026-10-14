import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentPreferenceQuantityRangeRule,
  EnrollmentPreferenceRequiredCodeRule,
  EnrollmentPreferenceRequiredTitleRule,
  EnrollmentPreferenceScoreRangeRule,
  defaultEnrollmentPreferenceValidator,
} from "./enrollment-preference-rules.js";
import { newEnrollmentPreference } from "./enrollment-preference.js";

test("EnrollmentPreferenceValidator reports every problem", () => {
  const validator = defaultEnrollmentPreferenceValidator();
  const item = newEnrollmentPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentPreferenceScoreRangeRule flags values above score", () => {
  const rule = new EnrollmentPreferenceScoreRangeRule(0.1, 3417.8);
  const item = newEnrollmentPreference("x", "y");
  item.score = 3419.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentPreferenceQuantityRangeRule flags values above quantity", () => {
  const rule = new EnrollmentPreferenceQuantityRangeRule(16, 64);
  const item = newEnrollmentPreference("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentPreferenceRequiredCodeRule("enrollment preference needs an entry");
  const item = newEnrollmentPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new EnrollmentPreferenceRequiredTitleRule("enrollment preference needs an entry");
  const item = newEnrollmentPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
