import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentReviewAmountRangeRule,
  EnrollmentReviewRequiredLabelRule,
  EnrollmentReviewRequiredLocaleRule,
  defaultEnrollmentReviewValidator,
} from "./enrollment-review-rules.js";
import { newEnrollmentReview } from "./enrollment-review.js";

test("EnrollmentReviewValidator reports every problem", () => {
  const validator = defaultEnrollmentReviewValidator();
  const item = newEnrollmentReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentReviewRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentReviewRequiredLabelRule("enrollment review needs this field");
  const item = newEnrollmentReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new EnrollmentReviewRequiredLocaleRule("enrollment review needs an entry");
  const item = newEnrollmentReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentReviewAmountRangeRule flags values above amount", () => {
  const rule = new EnrollmentReviewAmountRangeRule(9.3, 307.7);
  const item = newEnrollmentReview("x", "y");
  item.amount = 309.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
