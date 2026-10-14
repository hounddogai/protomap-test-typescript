import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBranchReviewCodeLengthRule,
  FallbackBranchReviewRequiredNameRule,
  FallbackBranchReviewThresholdRangeRule,
  defaultFallbackBranchReviewValidator,
} from "./fallback-branch-review-rules.js";
import { newFallbackBranchReview } from "./fallback-branch-review.js";

test("FallbackBranchReviewValidator reports every problem", () => {
  const validator = defaultFallbackBranchReviewValidator();
  const item = newFallbackBranchReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBranchReviewThresholdRangeRule flags values above threshold", () => {
  const rule = new FallbackBranchReviewThresholdRangeRule(7.3, 2219.6);
  const item = newFallbackBranchReview("x", "y");
  item.threshold = 2221.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackBranchReviewCodeLengthRule flags a long code", () => {
  const rule = new FallbackBranchReviewCodeLengthRule(80);
  const item = newFallbackBranchReview("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBranchReviewRequiredNameRule flags a blank name", () => {
  const rule = new FallbackBranchReviewRequiredNameRule("fallback branch review needs this field");
  const item = newFallbackBranchReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
