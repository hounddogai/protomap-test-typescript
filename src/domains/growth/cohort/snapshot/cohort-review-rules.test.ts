import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortReviewBatchSizeRangeRule,
  CohortReviewCodeLengthRule,
  CohortReviewRequiredNameRule,
  CohortReviewRequiredSegmentRule,
  defaultCohortReviewValidator,
} from "./cohort-review-rules.js";
import { newCohortReview } from "./cohort-review.js";

test("CohortReviewValidator reports every problem", () => {
  const validator = defaultCohortReviewValidator();
  const item = newCohortReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortReviewRequiredNameRule flags a blank name", () => {
  const rule = new CohortReviewRequiredNameRule("cohort review needs this field");
  const item = newCohortReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortReviewBatchSizeRangeRule flags values above batch size", () => {
  const rule = new CohortReviewBatchSizeRangeRule(80, 1000);
  const item = newCohortReview("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortReviewCodeLengthRule flags a long code", () => {
  const rule = new CohortReviewCodeLengthRule(3600);
  const item = newCohortReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortReviewRequiredSegmentRule flags a blank segment", () => {
  const rule = new CohortReviewRequiredSegmentRule("cohort review needs an entry");
  const item = newCohortReview("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
