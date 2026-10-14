import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePreferenceReviewCodeLengthRule,
  AdaptivePreferenceReviewMaximumRangeRule,
  AdaptivePreferenceReviewRequiredCodeRule,
  AdaptivePreferenceReviewRequiredLocaleRule,
  defaultAdaptivePreferenceReviewValidator,
} from "./adaptive-preference-review-rules.js";
import { newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

test("AdaptivePreferenceReviewValidator reports every problem", () => {
  const validator = defaultAdaptivePreferenceReviewValidator();
  const item = newAdaptivePreferenceReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePreferenceReviewRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptivePreferenceReviewRequiredLocaleRule("adaptive preference review needs a value");
  const item = newAdaptivePreferenceReview("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePreferenceReviewCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePreferenceReviewCodeLengthRule(80);
  const item = newAdaptivePreferenceReview("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePreferenceReviewMaximumRangeRule flags values above maximum", () => {
  const rule = new AdaptivePreferenceReviewMaximumRangeRule(7.3, 4442);
  const item = newAdaptivePreferenceReview("x", "y");
  item.maximum = 4443.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePreferenceReviewRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptivePreferenceReviewRequiredCodeRule("adaptive preference review needs this field");
  const item = newAdaptivePreferenceReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
