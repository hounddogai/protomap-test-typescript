import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeReviewImpressionsRangeRule,
  ChallengeReviewNameLengthRule,
  ChallengeReviewPriorityRangeRule,
  ChallengeReviewRequiredCohortRule,
  defaultChallengeReviewValidator,
} from "./challenge-review-rules.js";
import { newChallengeReview } from "./challenge-review.js";

test("ChallengeReviewValidator reports every problem", () => {
  const validator = defaultChallengeReviewValidator();
  const item = newChallengeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeReviewNameLengthRule flags a long name", () => {
  const rule = new ChallengeReviewNameLengthRule(80);
  const item = newChallengeReview("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeReviewRequiredCohortRule flags a blank cohort", () => {
  const rule = new ChallengeReviewRequiredCohortRule("challenge review needs a value");
  const item = newChallengeReview("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeReviewImpressionsRangeRule flags values above impressions", () => {
  const rule = new ChallengeReviewImpressionsRangeRule(64, 80);
  const item = newChallengeReview("x", "y");
  item.impressions = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeReviewPriorityRangeRule flags values above priority", () => {
  const rule = new ChallengeReviewPriorityRangeRule(3600, 86400);
  const item = newChallengeReview("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
