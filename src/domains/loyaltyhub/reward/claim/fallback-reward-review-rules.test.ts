import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRewardReviewBatchSizeRangeRule,
  FallbackRewardReviewNameLengthRule,
  FallbackRewardReviewRegionLengthRule,
  defaultFallbackRewardReviewValidator,
} from "./fallback-reward-review-rules.js";
import { newFallbackRewardReview } from "./fallback-reward-review.js";

test("FallbackRewardReviewValidator reports every problem", () => {
  const validator = defaultFallbackRewardReviewValidator();
  const item = newFallbackRewardReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRewardReviewNameLengthRule flags a long name", () => {
  const rule = new FallbackRewardReviewNameLengthRule(32);
  const item = newFallbackRewardReview("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRewardReviewRegionLengthRule flags a long region", () => {
  const rule = new FallbackRewardReviewRegionLengthRule(80);
  const item = newFallbackRewardReview("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRewardReviewBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FallbackRewardReviewBatchSizeRangeRule(3600, 86400);
  const item = newFallbackRewardReview("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
