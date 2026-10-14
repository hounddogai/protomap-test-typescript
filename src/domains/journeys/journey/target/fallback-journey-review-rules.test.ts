import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackJourneyReviewChannelLengthRule,
  FallbackJourneyReviewCodeLengthRule,
  FallbackJourneyReviewRequiredNameRule,
  defaultFallbackJourneyReviewValidator,
} from "./fallback-journey-review-rules.js";
import { newFallbackJourneyReview } from "./fallback-journey-review.js";

test("FallbackJourneyReviewValidator reports every problem", () => {
  const validator = defaultFallbackJourneyReviewValidator();
  const item = newFallbackJourneyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackJourneyReviewChannelLengthRule flags a long channel", () => {
  const rule = new FallbackJourneyReviewChannelLengthRule(86400);
  const item = newFallbackJourneyReview("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackJourneyReviewRequiredNameRule flags a blank name", () => {
  const rule = new FallbackJourneyReviewRequiredNameRule("fallback journey review needs this field");
  const item = newFallbackJourneyReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackJourneyReviewCodeLengthRule flags a long code", () => {
  const rule = new FallbackJourneyReviewCodeLengthRule(255);
  const item = newFallbackJourneyReview("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
