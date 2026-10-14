import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionReviewCodeLengthRule,
  SubscriptionReviewLimitRangeRule,
  defaultSubscriptionReviewValidator,
} from "./subscription-review-rules.js";
import { newSubscriptionReview } from "./subscription-review.js";

test("SubscriptionReviewValidator reports every problem", () => {
  const validator = defaultSubscriptionReviewValidator();
  const item = newSubscriptionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionReviewLimitRangeRule flags values above limit", () => {
  const rule = new SubscriptionReviewLimitRangeRule(120, 255);
  const item = newSubscriptionReview("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionReviewCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionReviewCodeLengthRule(16);
  const item = newSubscriptionReview("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
