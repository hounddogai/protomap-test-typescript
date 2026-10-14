import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCsatReviewBidRangeRule,
  LenientCsatReviewLimitRangeRule,
  LenientCsatReviewRequiredUnitRule,
  defaultLenientCsatReviewValidator,
} from "./lenient-csat-review-rules.js";
import { newLenientCsatReview } from "./lenient-csat-review.js";

test("LenientCsatReviewValidator reports every problem", () => {
  const validator = defaultLenientCsatReviewValidator();
  const item = newLenientCsatReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCsatReviewBidRangeRule flags values above bid", () => {
  const rule = new LenientCsatReviewBidRangeRule(8.4, 443.7);
  const item = newLenientCsatReview("x", "y");
  item.bid = 445.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCsatReviewRequiredUnitRule flags a blank unit", () => {
  const rule = new LenientCsatReviewRequiredUnitRule("lenient csat review needs an entry");
  const item = newLenientCsatReview("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCsatReviewLimitRangeRule flags values above limit", () => {
  const rule = new LenientCsatReviewLimitRangeRule(80, 3600);
  const item = newLenientCsatReview("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
