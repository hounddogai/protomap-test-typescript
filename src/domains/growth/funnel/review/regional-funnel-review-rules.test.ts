import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalFunnelReviewBidRangeRule,
  RegionalFunnelReviewCodeLengthRule,
  RegionalFunnelReviewRequiredChannelRule,
  RegionalFunnelReviewRequiredCodeRule,
  RegionalFunnelReviewRequiredTitleRule,
  defaultRegionalFunnelReviewValidator,
} from "./regional-funnel-review-rules.js";
import { newRegionalFunnelReview } from "./regional-funnel-review.js";

test("RegionalFunnelReviewValidator reports every problem", () => {
  const validator = defaultRegionalFunnelReviewValidator();
  const item = newRegionalFunnelReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalFunnelReviewRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalFunnelReviewRequiredTitleRule("regional funnel review needs an entry");
  const item = newRegionalFunnelReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalFunnelReviewCodeLengthRule flags a long code", () => {
  const rule = new RegionalFunnelReviewCodeLengthRule(3600);
  const item = newRegionalFunnelReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalFunnelReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalFunnelReviewRequiredCodeRule("regional funnel review needs a value");
  const item = newRegionalFunnelReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalFunnelReviewBidRangeRule flags values above bid", () => {
  const rule = new RegionalFunnelReviewBidRangeRule(0.9, 1520.1);
  const item = newRegionalFunnelReview("x", "y");
  item.bid = 1521.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalFunnelReviewRequiredChannelRule flags a blank channel", () => {
  const rule = new RegionalFunnelReviewRequiredChannelRule("regional funnel review needs a value");
  const item = newRegionalFunnelReview("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
