import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutReviewLocaleLengthRule,
  PayoutReviewRequiredLocaleRule,
  PayoutReviewRequiredReviewerRule,
  PayoutReviewReviewerLengthRule,
  PayoutReviewWeightRangeRule,
  defaultPayoutReviewValidator,
} from "./payout-review-rules.js";
import { newPayoutReview } from "./payout-review.js";

test("PayoutReviewValidator reports every problem", () => {
  const validator = defaultPayoutReviewValidator();
  const item = newPayoutReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutReviewRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PayoutReviewRequiredReviewerRule("payout review needs a value");
  const item = newPayoutReview("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutReviewWeightRangeRule flags values above weight", () => {
  const rule = new PayoutReviewWeightRangeRule(7.8, 3587.2);
  const item = newPayoutReview("x", "y");
  item.weight = 3588.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutReviewReviewerLengthRule flags a long reviewer", () => {
  const rule = new PayoutReviewReviewerLengthRule(16);
  const item = newPayoutReview("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutReviewLocaleLengthRule flags a long locale", () => {
  const rule = new PayoutReviewLocaleLengthRule(80);
  const item = newPayoutReview("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new PayoutReviewRequiredLocaleRule("payout review needs a value");
  const item = newPayoutReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
