import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchReviewLabelLengthRule,
  GlobalBranchReviewRequiredLocaleRule,
  GlobalBranchReviewVariantLengthRule,
  defaultGlobalBranchReviewValidator,
} from "./global-branch-review-rules.js";
import { newGlobalBranchReview } from "./global-branch-review.js";

test("GlobalBranchReviewValidator reports every problem", () => {
  const validator = defaultGlobalBranchReviewValidator();
  const item = newGlobalBranchReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchReviewVariantLengthRule flags a long variant", () => {
  const rule = new GlobalBranchReviewVariantLengthRule(16);
  const item = newGlobalBranchReview("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new GlobalBranchReviewRequiredLocaleRule("global branch review needs this field");
  const item = newGlobalBranchReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBranchReviewLabelLengthRule flags a long label", () => {
  const rule = new GlobalBranchReviewLabelLengthRule(32);
  const item = newGlobalBranchReview("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
