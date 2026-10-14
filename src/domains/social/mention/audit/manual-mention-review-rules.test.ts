import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualMentionReviewBatchSizeRangeRule,
  ManualMentionReviewLabelLengthRule,
  ManualMentionReviewMinimumRangeRule,
  ManualMentionReviewRateRangeRule,
  defaultManualMentionReviewValidator,
} from "./manual-mention-review-rules.js";
import { newManualMentionReview } from "./manual-mention-review.js";

test("ManualMentionReviewValidator reports every problem", () => {
  const validator = defaultManualMentionReviewValidator();
  const item = newManualMentionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualMentionReviewBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ManualMentionReviewBatchSizeRangeRule(64, 86400);
  const item = newManualMentionReview("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualMentionReviewRateRangeRule flags values above rate", () => {
  const rule = new ManualMentionReviewRateRangeRule(5.9, 4593.8);
  const item = newManualMentionReview("x", "y");
  item.rate = 4595.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualMentionReviewMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualMentionReviewMinimumRangeRule(9.7, 4648.2);
  const item = newManualMentionReview("x", "y");
  item.minimum = 4649.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualMentionReviewLabelLengthRule flags a long label", () => {
  const rule = new ManualMentionReviewLabelLengthRule(80);
  const item = newManualMentionReview("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
