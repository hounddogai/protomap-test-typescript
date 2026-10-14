import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightReviewRequiredCohortRule,
  InsightReviewRequiredTitleRule,
  InsightReviewWindowDaysRangeRule,
  defaultInsightReviewValidator,
} from "./insight-review-rules.js";
import { newInsightReview } from "./insight-review.js";

test("InsightReviewValidator reports every problem", () => {
  const validator = defaultInsightReviewValidator();
  const item = newInsightReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightReviewRequiredTitleRule flags a blank title", () => {
  const rule = new InsightReviewRequiredTitleRule("insight review needs an entry");
  const item = newInsightReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightReviewWindowDaysRangeRule flags values above window days", () => {
  const rule = new InsightReviewWindowDaysRangeRule(16, 64);
  const item = newInsightReview("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightReviewRequiredCohortRule flags a blank cohort", () => {
  const rule = new InsightReviewRequiredCohortRule("insight review needs this field");
  const item = newInsightReview("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
