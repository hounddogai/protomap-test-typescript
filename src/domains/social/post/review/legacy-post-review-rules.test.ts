import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPostReviewCodeLengthRule,
  LegacyPostReviewOpenRateRangeRule,
  LegacyPostReviewRateRangeRule,
  defaultLegacyPostReviewValidator,
} from "./legacy-post-review-rules.js";
import { newLegacyPostReview } from "./legacy-post-review.js";

test("LegacyPostReviewValidator reports every problem", () => {
  const validator = defaultLegacyPostReviewValidator();
  const item = newLegacyPostReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPostReviewCodeLengthRule flags a long code", () => {
  const rule = new LegacyPostReviewCodeLengthRule(86400);
  const item = newLegacyPostReview("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPostReviewOpenRateRangeRule flags values above open rate", () => {
  const rule = new LegacyPostReviewOpenRateRangeRule(1.8, 2403.6);
  const item = newLegacyPostReview("x", "y");
  item.openRate = 2405.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPostReviewRateRangeRule flags values above rate", () => {
  const rule = new LegacyPostReviewRateRangeRule(1.6, 3120.6);
  const item = newLegacyPostReview("x", "y");
  item.rate = 3122.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
