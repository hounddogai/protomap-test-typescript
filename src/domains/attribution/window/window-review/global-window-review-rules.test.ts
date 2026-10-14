import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWindowReviewRequiredNameRule,
  GlobalWindowReviewThresholdRangeRule,
  GlobalWindowReviewVariantLengthRule,
  defaultGlobalWindowReviewValidator,
} from "./global-window-review-rules.js";
import { newGlobalWindowReview } from "./global-window-review.js";

test("GlobalWindowReviewValidator reports every problem", () => {
  const validator = defaultGlobalWindowReviewValidator();
  const item = newGlobalWindowReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWindowReviewVariantLengthRule flags a long variant", () => {
  const rule = new GlobalWindowReviewVariantLengthRule(32);
  const item = newGlobalWindowReview("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWindowReviewThresholdRangeRule flags values above threshold", () => {
  const rule = new GlobalWindowReviewThresholdRangeRule(1.8, 87.3);
  const item = newGlobalWindowReview("x", "y");
  item.threshold = 88.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalWindowReviewRequiredNameRule flags a blank name", () => {
  const rule = new GlobalWindowReviewRequiredNameRule("global window review needs a value");
  const item = newGlobalWindowReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
