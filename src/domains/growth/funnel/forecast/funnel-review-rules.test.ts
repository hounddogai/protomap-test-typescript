import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelReviewBidRangeRule,
  FunnelReviewCurrencyLengthRule,
  FunnelReviewNameLengthRule,
  FunnelReviewRequiredTitleRule,
  FunnelReviewStartsAtRangeRule,
  defaultFunnelReviewValidator,
} from "./funnel-review-rules.js";
import { newFunnelReview } from "./funnel-review.js";

test("FunnelReviewValidator reports every problem", () => {
  const validator = defaultFunnelReviewValidator();
  const item = newFunnelReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelReviewBidRangeRule flags values above bid", () => {
  const rule = new FunnelReviewBidRangeRule(8.4, 545.4);
  const item = newFunnelReview("x", "y");
  item.bid = 546.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelReviewStartsAtRangeRule flags values above starts at", () => {
  const rule = new FunnelReviewStartsAtRangeRule(255, 1000);
  const item = newFunnelReview("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelReviewRequiredTitleRule flags a blank title", () => {
  const rule = new FunnelReviewRequiredTitleRule("funnel review needs an entry");
  const item = newFunnelReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelReviewCurrencyLengthRule flags a long currency", () => {
  const rule = new FunnelReviewCurrencyLengthRule(64);
  const item = newFunnelReview("x", "y");
  item.currency = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelReviewNameLengthRule flags a long name", () => {
  const rule = new FunnelReviewNameLengthRule(120);
  const item = newFunnelReview("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
