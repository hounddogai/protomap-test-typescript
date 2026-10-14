import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedApprovalReviewBudgetRangeRule,
  BatchedApprovalReviewDiscountRangeRule,
  BatchedApprovalReviewDurationMinutesRangeRule,
  BatchedApprovalReviewRequiredCodeRule,
  BatchedApprovalReviewTitleLengthRule,
  BatchedApprovalReviewUpdatedAtRangeRule,
  defaultBatchedApprovalReviewValidator,
} from "./batched-approval-review-rules.js";
import { newBatchedApprovalReview } from "./batched-approval-review.js";

test("BatchedApprovalReviewValidator reports every problem", () => {
  const validator = defaultBatchedApprovalReviewValidator();
  const item = newBatchedApprovalReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedApprovalReviewDiscountRangeRule flags values above discount", () => {
  const rule = new BatchedApprovalReviewDiscountRangeRule(9.2, 1316.9);
  const item = newBatchedApprovalReview("x", "y");
  item.discount = 1318.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedApprovalReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedApprovalReviewRequiredCodeRule("batched approval review needs this field");
  const item = newBatchedApprovalReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedApprovalReviewTitleLengthRule flags a long title", () => {
  const rule = new BatchedApprovalReviewTitleLengthRule(255);
  const item = newBatchedApprovalReview("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedApprovalReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedApprovalReviewUpdatedAtRangeRule(32, 80);
  const item = newBatchedApprovalReview("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedApprovalReviewBudgetRangeRule flags values above budget", () => {
  const rule = new BatchedApprovalReviewBudgetRangeRule(9.4, 4871.7);
  const item = newBatchedApprovalReview("x", "y");
  item.budget = 4873.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedApprovalReviewDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BatchedApprovalReviewDurationMinutesRangeRule(255, 3600);
  const item = newBatchedApprovalReview("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
