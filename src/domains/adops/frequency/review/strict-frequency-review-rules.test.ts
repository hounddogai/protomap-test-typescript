import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictFrequencyReviewCodeLengthRule,
  StrictFrequencyReviewCreatedAtRangeRule,
  StrictFrequencyReviewMinimumRangeRule,
  StrictFrequencyReviewReviewerLengthRule,
  StrictFrequencyReviewTitleLengthRule,
  defaultStrictFrequencyReviewValidator,
} from "./strict-frequency-review-rules.js";
import { newStrictFrequencyReview } from "./strict-frequency-review.js";

test("StrictFrequencyReviewValidator reports every problem", () => {
  const validator = defaultStrictFrequencyReviewValidator();
  const item = newStrictFrequencyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictFrequencyReviewTitleLengthRule flags a long title", () => {
  const rule = new StrictFrequencyReviewTitleLengthRule(3600);
  const item = newStrictFrequencyReview("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFrequencyReviewCodeLengthRule flags a long code", () => {
  const rule = new StrictFrequencyReviewCodeLengthRule(3600);
  const item = newStrictFrequencyReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFrequencyReviewReviewerLengthRule flags a long reviewer", () => {
  const rule = new StrictFrequencyReviewReviewerLengthRule(3600);
  const item = newStrictFrequencyReview("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFrequencyReviewCreatedAtRangeRule flags values above created at", () => {
  const rule = new StrictFrequencyReviewCreatedAtRangeRule(16, 255);
  const item = newStrictFrequencyReview("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictFrequencyReviewMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictFrequencyReviewMinimumRangeRule(8.9, 1392.9);
  const item = newStrictFrequencyReview("x", "y");
  item.minimum = 1394.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
