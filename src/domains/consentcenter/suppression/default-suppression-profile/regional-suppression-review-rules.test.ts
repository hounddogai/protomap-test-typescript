import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSuppressionReviewCodeLengthRule,
  RegionalSuppressionReviewRequiredSummaryRule,
  RegionalSuppressionReviewUpdatedAtRangeRule,
  defaultRegionalSuppressionReviewValidator,
} from "./regional-suppression-review-rules.js";
import { newRegionalSuppressionReview } from "./regional-suppression-review.js";

test("RegionalSuppressionReviewValidator reports every problem", () => {
  const validator = defaultRegionalSuppressionReviewValidator();
  const item = newRegionalSuppressionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSuppressionReviewCodeLengthRule flags a long code", () => {
  const rule = new RegionalSuppressionReviewCodeLengthRule(16);
  const item = newRegionalSuppressionReview("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSuppressionReviewRequiredSummaryRule flags a blank summary", () => {
  const rule = new RegionalSuppressionReviewRequiredSummaryRule("regional suppression review needs an entry");
  const item = newRegionalSuppressionReview("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSuppressionReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RegionalSuppressionReviewUpdatedAtRangeRule(16, 3600);
  const item = newRegionalSuppressionReview("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
