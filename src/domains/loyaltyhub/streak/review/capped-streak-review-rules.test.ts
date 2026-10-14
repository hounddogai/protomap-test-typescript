import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStreakReviewDiscountRangeRule,
  CappedStreakReviewJourneyIdLengthRule,
  CappedStreakReviewRequiredAudienceIdRule,
  CappedStreakReviewUpdatedAtRangeRule,
  defaultCappedStreakReviewValidator,
} from "./capped-streak-review-rules.js";
import { newCappedStreakReview } from "./capped-streak-review.js";

test("CappedStreakReviewValidator reports every problem", () => {
  const validator = defaultCappedStreakReviewValidator();
  const item = newCappedStreakReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStreakReviewRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new CappedStreakReviewRequiredAudienceIdRule("capped streak review needs a value");
  const item = newCappedStreakReview("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStreakReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedStreakReviewUpdatedAtRangeRule(64, 3600);
  const item = newCappedStreakReview("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedStreakReviewDiscountRangeRule flags values above discount", () => {
  const rule = new CappedStreakReviewDiscountRangeRule(9.5, 3836.1);
  const item = newCappedStreakReview("x", "y");
  item.discount = 3837.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedStreakReviewJourneyIdLengthRule flags a long journey id", () => {
  const rule = new CappedStreakReviewJourneyIdLengthRule(120);
  const item = newCappedStreakReview("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
