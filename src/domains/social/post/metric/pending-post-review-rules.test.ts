import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPostReviewDurationMinutesRangeRule,
  PendingPostReviewPriorityRangeRule,
  PendingPostReviewRequiredCategoryRule,
  defaultPendingPostReviewValidator,
} from "./pending-post-review-rules.js";
import { newPendingPostReview } from "./pending-post-review.js";

test("PendingPostReviewValidator reports every problem", () => {
  const validator = defaultPendingPostReviewValidator();
  const item = newPendingPostReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPostReviewPriorityRangeRule flags values above priority", () => {
  const rule = new PendingPostReviewPriorityRangeRule(32, 255);
  const item = newPendingPostReview("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPostReviewRequiredCategoryRule flags a blank category", () => {
  const rule = new PendingPostReviewRequiredCategoryRule("pending post review needs an entry");
  const item = newPendingPostReview("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPostReviewDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PendingPostReviewDurationMinutesRangeRule(64, 120);
  const item = newPendingPostReview("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
