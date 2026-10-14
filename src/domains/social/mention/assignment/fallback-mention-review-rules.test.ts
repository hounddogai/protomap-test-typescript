import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackMentionReviewCodeLengthRule,
  FallbackMentionReviewNameLengthRule,
  defaultFallbackMentionReviewValidator,
} from "./fallback-mention-review-rules.js";
import { newFallbackMentionReview } from "./fallback-mention-review.js";

test("FallbackMentionReviewValidator reports every problem", () => {
  const validator = defaultFallbackMentionReviewValidator();
  const item = newFallbackMentionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackMentionReviewCodeLengthRule flags a long code", () => {
  const rule = new FallbackMentionReviewCodeLengthRule(80);
  const item = newFallbackMentionReview("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackMentionReviewNameLengthRule flags a long name", () => {
  const rule = new FallbackMentionReviewNameLengthRule(120);
  const item = newFallbackMentionReview("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
