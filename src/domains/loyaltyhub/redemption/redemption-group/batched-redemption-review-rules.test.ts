import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRedemptionReviewLabelLengthRule,
  BatchedRedemptionReviewNameLengthRule,
  BatchedRedemptionReviewRequiredUnitRule,
  BatchedRedemptionReviewScoreRangeRule,
  defaultBatchedRedemptionReviewValidator,
} from "./batched-redemption-review-rules.js";
import { newBatchedRedemptionReview } from "./batched-redemption-review.js";

test("BatchedRedemptionReviewValidator reports every problem", () => {
  const validator = defaultBatchedRedemptionReviewValidator();
  const item = newBatchedRedemptionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRedemptionReviewScoreRangeRule flags values above score", () => {
  const rule = new BatchedRedemptionReviewScoreRangeRule(6.6, 1219.8);
  const item = newBatchedRedemptionReview("x", "y");
  item.score = 1221.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRedemptionReviewNameLengthRule flags a long name", () => {
  const rule = new BatchedRedemptionReviewNameLengthRule(80);
  const item = newBatchedRedemptionReview("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRedemptionReviewLabelLengthRule flags a long label", () => {
  const rule = new BatchedRedemptionReviewLabelLengthRule(3600);
  const item = newBatchedRedemptionReview("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRedemptionReviewRequiredUnitRule flags a blank unit", () => {
  const rule = new BatchedRedemptionReviewRequiredUnitRule("batched redemption review needs an entry");
  const item = newBatchedRedemptionReview("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
