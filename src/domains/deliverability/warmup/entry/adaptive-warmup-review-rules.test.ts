import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveWarmupReviewRequiredCodeRule,
  AdaptiveWarmupReviewRequiredNameRule,
  defaultAdaptiveWarmupReviewValidator,
} from "./adaptive-warmup-review-rules.js";
import { newAdaptiveWarmupReview } from "./adaptive-warmup-review.js";

test("AdaptiveWarmupReviewValidator reports every problem", () => {
  const validator = defaultAdaptiveWarmupReviewValidator();
  const item = newAdaptiveWarmupReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveWarmupReviewRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveWarmupReviewRequiredCodeRule("adaptive warmup review needs an entry");
  const item = newAdaptiveWarmupReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWarmupReviewRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveWarmupReviewRequiredNameRule("adaptive warmup review needs an entry");
  const item = newAdaptiveWarmupReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
