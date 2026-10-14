import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSenderReviewClicksRangeRule,
  AdaptiveSenderReviewRequiredLabelRule,
  AdaptiveSenderReviewSendAtRangeRule,
  defaultAdaptiveSenderReviewValidator,
} from "./adaptive-sender-review-rules.js";
import { newAdaptiveSenderReview } from "./adaptive-sender-review.js";

test("AdaptiveSenderReviewValidator reports every problem", () => {
  const validator = defaultAdaptiveSenderReviewValidator();
  const item = newAdaptiveSenderReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSenderReviewClicksRangeRule flags values above clicks", () => {
  const rule = new AdaptiveSenderReviewClicksRangeRule(120, 1000);
  const item = newAdaptiveSenderReview("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveSenderReviewSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptiveSenderReviewSendAtRangeRule(3600, 3600);
  const item = newAdaptiveSenderReview("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveSenderReviewRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveSenderReviewRequiredLabelRule("adaptive sender review needs this field");
  const item = newAdaptiveSenderReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
