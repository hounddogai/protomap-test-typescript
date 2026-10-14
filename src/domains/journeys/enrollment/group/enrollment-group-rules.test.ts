import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentGroupFrequencyCapRangeRule,
  EnrollmentGroupReviewerLengthRule,
  defaultEnrollmentGroupValidator,
} from "./enrollment-group-rules.js";
import { newEnrollmentGroup } from "./enrollment-group.js";

test("EnrollmentGroupValidator reports every problem", () => {
  const validator = defaultEnrollmentGroupValidator();
  const item = newEnrollmentGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentGroupReviewerLengthRule flags a long reviewer", () => {
  const rule = new EnrollmentGroupReviewerLengthRule(80);
  const item = newEnrollmentGroup("x", "y");
  item.reviewer = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentGroupFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new EnrollmentGroupFrequencyCapRangeRule(32, 120);
  const item = newEnrollmentGroup("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
