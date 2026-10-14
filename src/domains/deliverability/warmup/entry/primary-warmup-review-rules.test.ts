import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryWarmupReviewRequiredSummaryRule,
  PrimaryWarmupReviewRequiredTitleRule,
  PrimaryWarmupReviewSummaryLengthRule,
  PrimaryWarmupReviewTitleLengthRule,
  PrimaryWarmupReviewUnitLengthRule,
  defaultPrimaryWarmupReviewValidator,
} from "./primary-warmup-review-rules.js";
import { newPrimaryWarmupReview } from "./primary-warmup-review.js";

test("PrimaryWarmupReviewValidator reports every problem", () => {
  const validator = defaultPrimaryWarmupReviewValidator();
  const item = newPrimaryWarmupReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryWarmupReviewUnitLengthRule flags a long unit", () => {
  const rule = new PrimaryWarmupReviewUnitLengthRule(1000);
  const item = newPrimaryWarmupReview("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryWarmupReviewTitleLengthRule flags a long title", () => {
  const rule = new PrimaryWarmupReviewTitleLengthRule(80);
  const item = newPrimaryWarmupReview("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryWarmupReviewSummaryLengthRule flags a long summary", () => {
  const rule = new PrimaryWarmupReviewSummaryLengthRule(80);
  const item = newPrimaryWarmupReview("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryWarmupReviewRequiredSummaryRule flags a blank summary", () => {
  const rule = new PrimaryWarmupReviewRequiredSummaryRule("primary warmup review needs this field");
  const item = newPrimaryWarmupReview("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryWarmupReviewRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryWarmupReviewRequiredTitleRule("primary warmup review needs a value");
  const item = newPrimaryWarmupReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
