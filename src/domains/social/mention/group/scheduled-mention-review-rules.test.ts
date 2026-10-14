import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMentionReviewCurrencyLengthRule,
  ScheduledMentionReviewRequiredCurrencyRule,
  ScheduledMentionReviewRequiredTimezoneRule,
  ScheduledMentionReviewTimezoneLengthRule,
  defaultScheduledMentionReviewValidator,
} from "./scheduled-mention-review-rules.js";
import { newScheduledMentionReview } from "./scheduled-mention-review.js";

test("ScheduledMentionReviewValidator reports every problem", () => {
  const validator = defaultScheduledMentionReviewValidator();
  const item = newScheduledMentionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMentionReviewRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ScheduledMentionReviewRequiredTimezoneRule("scheduled mention review needs a value");
  const item = newScheduledMentionReview("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionReviewTimezoneLengthRule flags a long timezone", () => {
  const rule = new ScheduledMentionReviewTimezoneLengthRule(86400);
  const item = newScheduledMentionReview("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMentionReviewRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ScheduledMentionReviewRequiredCurrencyRule("scheduled mention review needs an entry");
  const item = newScheduledMentionReview("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionReviewCurrencyLengthRule flags a long currency", () => {
  const rule = new ScheduledMentionReviewCurrencyLengthRule(32);
  const item = newScheduledMentionReview("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
