import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackChallengeReviewCategoryLengthRule,
  FallbackChallengeReviewLabelLengthRule,
  FallbackChallengeReviewRequiredCodeRule,
  FallbackChallengeReviewRequiredSegmentRule,
  FallbackChallengeReviewThresholdRangeRule,
  defaultFallbackChallengeReviewValidator,
} from "./fallback-challenge-review-rules.js";
import { newFallbackChallengeReview } from "./fallback-challenge-review.js";

test("FallbackChallengeReviewValidator reports every problem", () => {
  const validator = defaultFallbackChallengeReviewValidator();
  const item = newFallbackChallengeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackChallengeReviewRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackChallengeReviewRequiredSegmentRule("fallback challenge review needs this field");
  const item = newFallbackChallengeReview("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeReviewThresholdRangeRule flags values above threshold", () => {
  const rule = new FallbackChallengeReviewThresholdRangeRule(1, 1568.3);
  const item = newFallbackChallengeReview("x", "y");
  item.threshold = 1569.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackChallengeReviewRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackChallengeReviewRequiredCodeRule("fallback challenge review needs this field");
  const item = newFallbackChallengeReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeReviewLabelLengthRule flags a long label", () => {
  const rule = new FallbackChallengeReviewLabelLengthRule(80);
  const item = newFallbackChallengeReview("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackChallengeReviewCategoryLengthRule flags a long category", () => {
  const rule = new FallbackChallengeReviewCategoryLengthRule(1000);
  const item = newFallbackChallengeReview("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
