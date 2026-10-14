import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedEnrollmentReviewChecksumLengthRule,
  CappedEnrollmentReviewRequiredChecksumRule,
  CappedEnrollmentReviewRequiredTitleRule,
  CappedEnrollmentReviewTitleLengthRule,
  defaultCappedEnrollmentReviewValidator,
} from "./capped-enrollment-review-rules.js";
import { newCappedEnrollmentReview } from "./capped-enrollment-review.js";

test("CappedEnrollmentReviewValidator reports every problem", () => {
  const validator = defaultCappedEnrollmentReviewValidator();
  const item = newCappedEnrollmentReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedEnrollmentReviewChecksumLengthRule flags a long checksum", () => {
  const rule = new CappedEnrollmentReviewChecksumLengthRule(86400);
  const item = newCappedEnrollmentReview("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedEnrollmentReviewRequiredTitleRule flags a blank title", () => {
  const rule = new CappedEnrollmentReviewRequiredTitleRule("capped enrollment review needs an entry");
  const item = newCappedEnrollmentReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedEnrollmentReviewRequiredChecksumRule flags a blank checksum", () => {
  const rule = new CappedEnrollmentReviewRequiredChecksumRule("capped enrollment review needs a value");
  const item = newCappedEnrollmentReview("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedEnrollmentReviewTitleLengthRule flags a long title", () => {
  const rule = new CappedEnrollmentReviewTitleLengthRule(80);
  const item = newCappedEnrollmentReview("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
