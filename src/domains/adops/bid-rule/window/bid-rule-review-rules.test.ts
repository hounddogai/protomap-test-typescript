import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleReviewRevisionRangeRule,
  BidRuleReviewTitleLengthRule,
  defaultBidRuleReviewValidator,
} from "./bid-rule-review-rules.js";
import { newBidRuleReview } from "./bid-rule-review.js";

test("BidRuleReviewValidator reports every problem", () => {
  const validator = defaultBidRuleReviewValidator();
  const item = newBidRuleReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleReviewRevisionRangeRule flags values above revision", () => {
  const rule = new BidRuleReviewRevisionRangeRule(255, 1000);
  const item = newBidRuleReview("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleReviewTitleLengthRule flags a long title", () => {
  const rule = new BidRuleReviewTitleLengthRule(80);
  const item = newBidRuleReview("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
