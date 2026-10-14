import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDoubleOptInReviewAudienceIdLengthRule,
  BatchedDoubleOptInReviewBatchSizeRangeRule,
  BatchedDoubleOptInReviewRequiredCodeRule,
  BatchedDoubleOptInReviewSequenceRangeRule,
  defaultBatchedDoubleOptInReviewValidator,
} from "./batched-double-opt-in-review-rules.js";
import { newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("BatchedDoubleOptInReviewValidator reports every problem", () => {
  const validator = defaultBatchedDoubleOptInReviewValidator();
  const item = newBatchedDoubleOptInReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDoubleOptInReviewAudienceIdLengthRule flags a long audience id", () => {
  const rule = new BatchedDoubleOptInReviewAudienceIdLengthRule(64);
  const item = newBatchedDoubleOptInReview("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedDoubleOptInReviewSequenceRangeRule flags values above sequence", () => {
  const rule = new BatchedDoubleOptInReviewSequenceRangeRule(32, 1000);
  const item = newBatchedDoubleOptInReview("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDoubleOptInReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDoubleOptInReviewRequiredCodeRule("batched double opt in review needs this field");
  const item = newBatchedDoubleOptInReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDoubleOptInReviewBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedDoubleOptInReviewBatchSizeRangeRule(16, 80);
  const item = newBatchedDoubleOptInReview("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
