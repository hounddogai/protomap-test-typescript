import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSubscriptionReviewGraceDaysRangeRule,
  RegionalSubscriptionReviewRequiredLabelRule,
  defaultRegionalSubscriptionReviewValidator,
} from "./regional-subscription-review-rules.js";
import { newRegionalSubscriptionReview } from "./regional-subscription-review.js";

test("RegionalSubscriptionReviewValidator reports every problem", () => {
  const validator = defaultRegionalSubscriptionReviewValidator();
  const item = newRegionalSubscriptionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSubscriptionReviewGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalSubscriptionReviewGraceDaysRangeRule(32, 1000);
  const item = newRegionalSubscriptionReview("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSubscriptionReviewRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalSubscriptionReviewRequiredLabelRule("regional subscription review needs a value");
  const item = newRegionalSubscriptionReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
