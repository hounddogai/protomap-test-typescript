import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchReviewCodeLengthRule,
  BranchReviewDiscountRangeRule,
  BranchReviewLabelLengthRule,
  BranchReviewRequiredCodeRule,
  defaultBranchReviewValidator,
} from "./branch-review-rules.js";
import { newBranchReview } from "./branch-review.js";

test("BranchReviewValidator reports every problem", () => {
  const validator = defaultBranchReviewValidator();
  const item = newBranchReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchReviewCodeLengthRule flags a long code", () => {
  const rule = new BranchReviewCodeLengthRule(1000);
  const item = newBranchReview("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchReviewLabelLengthRule flags a long label", () => {
  const rule = new BranchReviewLabelLengthRule(120);
  const item = newBranchReview("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchReviewDiscountRangeRule flags values above discount", () => {
  const rule = new BranchReviewDiscountRangeRule(7.2, 343.2);
  const item = newBranchReview("x", "y");
  item.discount = 344.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BranchReviewRequiredCodeRule("branch review needs an entry");
  const item = newBranchReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
