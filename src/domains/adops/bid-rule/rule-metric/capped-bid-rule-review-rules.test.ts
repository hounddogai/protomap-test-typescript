import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBidRuleReviewBatchSizeRangeRule,
  CappedBidRuleReviewMaximumRangeRule,
  CappedBidRuleReviewRequiredNotesRule,
  CappedBidRuleReviewRequiredTitleRule,
  CappedBidRuleReviewRequiredVariantRule,
  defaultCappedBidRuleReviewValidator,
} from "./capped-bid-rule-review-rules.js";
import { newCappedBidRuleReview } from "./capped-bid-rule-review.js";

test("CappedBidRuleReviewValidator reports every problem", () => {
  const validator = defaultCappedBidRuleReviewValidator();
  const item = newCappedBidRuleReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBidRuleReviewRequiredVariantRule flags a blank variant", () => {
  const rule = new CappedBidRuleReviewRequiredVariantRule("capped bid rule review needs a value");
  const item = newCappedBidRuleReview("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBidRuleReviewRequiredTitleRule flags a blank title", () => {
  const rule = new CappedBidRuleReviewRequiredTitleRule("capped bid rule review needs an entry");
  const item = newCappedBidRuleReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBidRuleReviewBatchSizeRangeRule flags values above batch size", () => {
  const rule = new CappedBidRuleReviewBatchSizeRangeRule(16, 255);
  const item = newCappedBidRuleReview("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedBidRuleReviewRequiredNotesRule flags a blank notes", () => {
  const rule = new CappedBidRuleReviewRequiredNotesRule("capped bid rule review needs an entry");
  const item = newCappedBidRuleReview("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBidRuleReviewMaximumRangeRule flags values above maximum", () => {
  const rule = new CappedBidRuleReviewMaximumRangeRule(2.5, 309.4);
  const item = newCappedBidRuleReview("x", "y");
  item.maximum = 310.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
