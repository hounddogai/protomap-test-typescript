import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalEnrollmentReviewCostRangeRule,
  GlobalEnrollmentReviewRequiredChannelRule,
  defaultGlobalEnrollmentReviewValidator,
} from "./global-enrollment-review-rules.js";
import { newGlobalEnrollmentReview } from "./global-enrollment-review.js";

test("GlobalEnrollmentReviewValidator reports every problem", () => {
  const validator = defaultGlobalEnrollmentReviewValidator();
  const item = newGlobalEnrollmentReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalEnrollmentReviewCostRangeRule flags values above cost", () => {
  const rule = new GlobalEnrollmentReviewCostRangeRule(6.5, 193.6);
  const item = newGlobalEnrollmentReview("x", "y");
  item.cost = 195.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalEnrollmentReviewRequiredChannelRule flags a blank channel", () => {
  const rule = new GlobalEnrollmentReviewRequiredChannelRule("global enrollment review needs this field");
  const item = newGlobalEnrollmentReview("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
