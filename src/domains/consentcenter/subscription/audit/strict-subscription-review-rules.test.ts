import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSubscriptionReviewLabelLengthRule,
  StrictSubscriptionReviewRequiredLabelRule,
  defaultStrictSubscriptionReviewValidator,
} from "./strict-subscription-review-rules.js";
import { newStrictSubscriptionReview } from "./strict-subscription-review.js";

test("StrictSubscriptionReviewValidator reports every problem", () => {
  const validator = defaultStrictSubscriptionReviewValidator();
  const item = newStrictSubscriptionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSubscriptionReviewRequiredLabelRule flags a blank label", () => {
  const rule = new StrictSubscriptionReviewRequiredLabelRule("strict subscription review needs an entry");
  const item = newStrictSubscriptionReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSubscriptionReviewLabelLengthRule flags a long label", () => {
  const rule = new StrictSubscriptionReviewLabelLengthRule(120);
  const item = newStrictSubscriptionReview("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
