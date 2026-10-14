import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBounceReviewCeilingRangeRule,
  PrimaryBounceReviewCodeLengthRule,
  PrimaryBounceReviewRequiredCohortRule,
  PrimaryBounceReviewTitleLengthRule,
  defaultPrimaryBounceReviewValidator,
} from "./primary-bounce-review-rules.js";
import { newPrimaryBounceReview } from "./primary-bounce-review.js";

test("PrimaryBounceReviewValidator reports every problem", () => {
  const validator = defaultPrimaryBounceReviewValidator();
  const item = newPrimaryBounceReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBounceReviewRequiredCohortRule flags a blank cohort", () => {
  const rule = new PrimaryBounceReviewRequiredCohortRule("primary bounce review needs a value");
  const item = newPrimaryBounceReview("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBounceReviewCeilingRangeRule flags values above ceiling", () => {
  const rule = new PrimaryBounceReviewCeilingRangeRule(0.2, 4508.4);
  const item = newPrimaryBounceReview("x", "y");
  item.ceiling = 4509.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBounceReviewTitleLengthRule flags a long title", () => {
  const rule = new PrimaryBounceReviewTitleLengthRule(255);
  const item = newPrimaryBounceReview("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryBounceReviewCodeLengthRule flags a long code", () => {
  const rule = new PrimaryBounceReviewCodeLengthRule(16);
  const item = newPrimaryBounceReview("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
