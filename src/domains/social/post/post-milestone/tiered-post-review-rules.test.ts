import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPostReviewLocaleLengthRule,
  TieredPostReviewRequiredCodeRule,
  defaultTieredPostReviewValidator,
} from "./tiered-post-review-rules.js";
import { newTieredPostReview } from "./tiered-post-review.js";

test("TieredPostReviewValidator reports every problem", () => {
  const validator = defaultTieredPostReviewValidator();
  const item = newTieredPostReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPostReviewLocaleLengthRule flags a long locale", () => {
  const rule = new TieredPostReviewLocaleLengthRule(255);
  const item = newTieredPostReview("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPostReviewRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPostReviewRequiredCodeRule("tiered post review needs an entry");
  const item = newTieredPostReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
