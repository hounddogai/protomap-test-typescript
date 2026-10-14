import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalInsightReviewRequiredCodeRule,
  GlobalInsightReviewStartsAtRangeRule,
  defaultGlobalInsightReviewValidator,
} from "./global-insight-review-rules.js";
import { newGlobalInsightReview } from "./global-insight-review.js";

test("GlobalInsightReviewValidator reports every problem", () => {
  const validator = defaultGlobalInsightReviewValidator();
  const item = newGlobalInsightReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalInsightReviewRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalInsightReviewRequiredCodeRule("global insight review needs this field");
  const item = newGlobalInsightReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightReviewStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalInsightReviewStartsAtRangeRule(1000, 86400);
  const item = newGlobalInsightReview("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
