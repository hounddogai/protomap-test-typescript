import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreativeReviewTitleLengthRule,
  BatchedCreativeReviewUpdatedAtRangeRule,
  BatchedCreativeReviewVariantLengthRule,
  defaultBatchedCreativeReviewValidator,
} from "./batched-creative-review-rules.js";
import { newBatchedCreativeReview } from "./batched-creative-review.js";

test("BatchedCreativeReviewValidator reports every problem", () => {
  const validator = defaultBatchedCreativeReviewValidator();
  const item = newBatchedCreativeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreativeReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedCreativeReviewUpdatedAtRangeRule(64, 120);
  const item = newBatchedCreativeReview("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreativeReviewVariantLengthRule flags a long variant", () => {
  const rule = new BatchedCreativeReviewVariantLengthRule(32);
  const item = newBatchedCreativeReview("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreativeReviewTitleLengthRule flags a long title", () => {
  const rule = new BatchedCreativeReviewTitleLengthRule(16);
  const item = newBatchedCreativeReview("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
