import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionReviewCategoryLengthRule,
  MentionReviewFloorValueRangeRule,
  MentionReviewOpenRateRangeRule,
  MentionReviewRequiredCodeRule,
  MentionReviewRequiredLocaleRule,
  defaultMentionReviewValidator,
} from "./mention-review-rules.js";
import { newMentionReview } from "./mention-review.js";

test("MentionReviewValidator reports every problem", () => {
  const validator = defaultMentionReviewValidator();
  const item = newMentionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionReviewRequiredCodeRule flags a blank code", () => {
  const rule = new MentionReviewRequiredCodeRule("mention review needs a value");
  const item = newMentionReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionReviewOpenRateRangeRule flags values above open rate", () => {
  const rule = new MentionReviewOpenRateRangeRule(0.4, 4848);
  const item = newMentionReview("x", "y");
  item.openRate = 4849.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new MentionReviewRequiredLocaleRule("mention review needs an entry");
  const item = newMentionReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionReviewFloorValueRangeRule flags values above floor value", () => {
  const rule = new MentionReviewFloorValueRangeRule(6.6, 1802.6);
  const item = newMentionReview("x", "y");
  item.floorValue = 1804.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionReviewCategoryLengthRule flags a long category", () => {
  const rule = new MentionReviewCategoryLengthRule(86400);
  const item = newMentionReview("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
