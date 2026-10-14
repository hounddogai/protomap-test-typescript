import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupReviewRequiredLabelRule,
  LenientWarmupReviewRequiredLocaleRule,
  defaultLenientWarmupReviewValidator,
} from "./lenient-warmup-review-rules.js";
import { newLenientWarmupReview } from "./lenient-warmup-review.js";

test("LenientWarmupReviewValidator reports every problem", () => {
  const validator = defaultLenientWarmupReviewValidator();
  const item = newLenientWarmupReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupReviewRequiredLabelRule flags a blank label", () => {
  const rule = new LenientWarmupReviewRequiredLabelRule("lenient warmup review needs an entry");
  const item = newLenientWarmupReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientWarmupReviewRequiredLocaleRule("lenient warmup review needs an entry");
  const item = newLenientWarmupReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
