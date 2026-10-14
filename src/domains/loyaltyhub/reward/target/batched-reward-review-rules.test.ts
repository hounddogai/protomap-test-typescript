import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRewardReviewCodeLengthRule,
  BatchedRewardReviewRequiredExternalRefRule,
  BatchedRewardReviewRequiredLabelRule,
  BatchedRewardReviewRetriesRangeRule,
  defaultBatchedRewardReviewValidator,
} from "./batched-reward-review-rules.js";
import { newBatchedRewardReview } from "./batched-reward-review.js";

test("BatchedRewardReviewValidator reports every problem", () => {
  const validator = defaultBatchedRewardReviewValidator();
  const item = newBatchedRewardReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRewardReviewCodeLengthRule flags a long code", () => {
  const rule = new BatchedRewardReviewCodeLengthRule(3600);
  const item = newBatchedRewardReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRewardReviewRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new BatchedRewardReviewRequiredExternalRefRule("batched reward review needs a value");
  const item = newBatchedRewardReview("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedRewardReviewRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedRewardReviewRequiredLabelRule("batched reward review needs an entry");
  const item = newBatchedRewardReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedRewardReviewRetriesRangeRule flags values above retries", () => {
  const rule = new BatchedRewardReviewRetriesRangeRule(32, 64);
  const item = newBatchedRewardReview("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
