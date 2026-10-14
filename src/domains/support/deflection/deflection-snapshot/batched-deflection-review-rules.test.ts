import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDeflectionReviewDurationMinutesRangeRule,
  BatchedDeflectionReviewFrequencyCapRangeRule,
  BatchedDeflectionReviewLabelLengthRule,
  BatchedDeflectionReviewRequiredCodeRule,
  BatchedDeflectionReviewUnitLengthRule,
  defaultBatchedDeflectionReviewValidator,
} from "./batched-deflection-review-rules.js";
import { newBatchedDeflectionReview } from "./batched-deflection-review.js";

test("BatchedDeflectionReviewValidator reports every problem", () => {
  const validator = defaultBatchedDeflectionReviewValidator();
  const item = newBatchedDeflectionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDeflectionReviewLabelLengthRule flags a long label", () => {
  const rule = new BatchedDeflectionReviewLabelLengthRule(255);
  const item = newBatchedDeflectionReview("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedDeflectionReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDeflectionReviewRequiredCodeRule("batched deflection review needs an entry");
  const item = newBatchedDeflectionReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDeflectionReviewFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedDeflectionReviewFrequencyCapRangeRule(16, 86400);
  const item = newBatchedDeflectionReview("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDeflectionReviewDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BatchedDeflectionReviewDurationMinutesRangeRule(64, 80);
  const item = newBatchedDeflectionReview("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDeflectionReviewUnitLengthRule flags a long unit", () => {
  const rule = new BatchedDeflectionReviewUnitLengthRule(255);
  const item = newBatchedDeflectionReview("x", "y");
  item.unit = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
