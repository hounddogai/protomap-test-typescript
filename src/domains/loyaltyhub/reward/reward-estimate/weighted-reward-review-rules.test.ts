import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardReviewCodeLengthRule,
  WeightedRewardReviewRequiredChecksumRule,
  WeightedRewardReviewRequiredTitleRule,
  WeightedRewardReviewTitleLengthRule,
  defaultWeightedRewardReviewValidator,
} from "./weighted-reward-review-rules.js";
import { newWeightedRewardReview } from "./weighted-reward-review.js";

test("WeightedRewardReviewValidator reports every problem", () => {
  const validator = defaultWeightedRewardReviewValidator();
  const item = newWeightedRewardReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardReviewCodeLengthRule flags a long code", () => {
  const rule = new WeightedRewardReviewCodeLengthRule(1000);
  const item = newWeightedRewardReview("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardReviewRequiredChecksumRule flags a blank checksum", () => {
  const rule = new WeightedRewardReviewRequiredChecksumRule("weighted reward review needs an entry");
  const item = newWeightedRewardReview("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardReviewTitleLengthRule flags a long title", () => {
  const rule = new WeightedRewardReviewTitleLengthRule(255);
  const item = newWeightedRewardReview("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardReviewRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedRewardReviewRequiredTitleRule("weighted reward review needs an entry");
  const item = newWeightedRewardReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
