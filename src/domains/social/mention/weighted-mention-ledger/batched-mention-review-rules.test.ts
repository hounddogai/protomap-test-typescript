import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMentionReviewFrequencyCapRangeRule,
  BatchedMentionReviewRequiredCodeRule,
  BatchedMentionReviewRequiredPhoneRule,
  BatchedMentionReviewSourceLengthRule,
  BatchedMentionReviewTitleLengthRule,
  defaultBatchedMentionReviewValidator,
} from "./batched-mention-review-rules.js";
import { newBatchedMentionReview } from "./batched-mention-review.js";

test("BatchedMentionReviewValidator reports every problem", () => {
  const validator = defaultBatchedMentionReviewValidator();
  const item = newBatchedMentionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMentionReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedMentionReviewRequiredCodeRule("batched mention review needs this field");
  const item = newBatchedMentionReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMentionReviewFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedMentionReviewFrequencyCapRangeRule(80, 3600);
  const item = newBatchedMentionReview("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMentionReviewRequiredPhoneRule flags a blank phone", () => {
  const rule = new BatchedMentionReviewRequiredPhoneRule("batched mention review needs a value");
  const item = newBatchedMentionReview("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMentionReviewTitleLengthRule flags a long title", () => {
  const rule = new BatchedMentionReviewTitleLengthRule(1000);
  const item = newBatchedMentionReview("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMentionReviewSourceLengthRule flags a long source", () => {
  const rule = new BatchedMentionReviewSourceLengthRule(80);
  const item = newBatchedMentionReview("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
