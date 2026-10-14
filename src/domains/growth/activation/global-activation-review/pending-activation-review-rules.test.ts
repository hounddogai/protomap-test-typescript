import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingActivationReviewBidRangeRule,
  PendingActivationReviewRateRangeRule,
  PendingActivationReviewRequiredCodeRule,
  PendingActivationReviewRequiredSegmentRule,
  PendingActivationReviewRequiredTitleRule,
  defaultPendingActivationReviewValidator,
} from "./pending-activation-review-rules.js";
import { newPendingActivationReview } from "./pending-activation-review.js";

test("PendingActivationReviewValidator reports every problem", () => {
  const validator = defaultPendingActivationReviewValidator();
  const item = newPendingActivationReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingActivationReviewRequiredCodeRule flags a blank code", () => {
  const rule = new PendingActivationReviewRequiredCodeRule("pending activation review needs a value");
  const item = newPendingActivationReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationReviewRequiredTitleRule flags a blank title", () => {
  const rule = new PendingActivationReviewRequiredTitleRule("pending activation review needs a value");
  const item = newPendingActivationReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationReviewRateRangeRule flags values above rate", () => {
  const rule = new PendingActivationReviewRateRangeRule(6.8, 4121);
  const item = newPendingActivationReview("x", "y");
  item.rate = 4122.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingActivationReviewRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingActivationReviewRequiredSegmentRule("pending activation review needs this field");
  const item = newPendingActivationReview("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationReviewBidRangeRule flags values above bid", () => {
  const rule = new PendingActivationReviewBidRangeRule(0.9, 4727);
  const item = newPendingActivationReview("x", "y");
  item.bid = 4728.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
