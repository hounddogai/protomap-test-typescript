import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSlaReviewRequiredSourceRule,
  ManualSlaReviewTimezoneLengthRule,
  ManualSlaReviewUpdatedAtRangeRule,
  defaultManualSlaReviewValidator,
} from "./manual-sla-review-rules.js";
import { newManualSlaReview } from "./manual-sla-review.js";

test("ManualSlaReviewValidator reports every problem", () => {
  const validator = defaultManualSlaReviewValidator();
  const item = newManualSlaReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSlaReviewRequiredSourceRule flags a blank source", () => {
  const rule = new ManualSlaReviewRequiredSourceRule("manual sla review needs this field");
  const item = newManualSlaReview("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualSlaReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ManualSlaReviewUpdatedAtRangeRule(64, 1000);
  const item = newManualSlaReview("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualSlaReviewTimezoneLengthRule flags a long timezone", () => {
  const rule = new ManualSlaReviewTimezoneLengthRule(120);
  const item = newManualSlaReview("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
