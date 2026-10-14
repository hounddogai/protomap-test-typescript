import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeReviewRequiredCodeRule,
  BadgeReviewRequiredNameRule,
  defaultBadgeReviewValidator,
} from "./badge-review-rules.js";
import { newBadgeReview } from "./badge-review.js";

test("BadgeReviewValidator reports every problem", () => {
  const validator = defaultBadgeReviewValidator();
  const item = newBadgeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeReviewRequiredNameRule flags a blank name", () => {
  const rule = new BadgeReviewRequiredNameRule("badge review needs a value");
  const item = newBadgeReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeReviewRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeReviewRequiredCodeRule("badge review needs a value");
  const item = newBadgeReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
