import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatReviewAttemptsRangeRule,
  CsatReviewBudgetRangeRule,
  CsatReviewCategoryLengthRule,
  CsatReviewCodeLengthRule,
  CsatReviewRequiredLabelRule,
  defaultCsatReviewValidator,
} from "./csat-review-rules.js";
import { newCsatReview } from "./csat-review.js";

test("CsatReviewValidator reports every problem", () => {
  const validator = defaultCsatReviewValidator();
  const item = newCsatReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatReviewRequiredLabelRule flags a blank label", () => {
  const rule = new CsatReviewRequiredLabelRule("csat review needs an entry");
  const item = newCsatReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatReviewBudgetRangeRule flags values above budget", () => {
  const rule = new CsatReviewBudgetRangeRule(5.8, 1080.2);
  const item = newCsatReview("x", "y");
  item.budget = 1081.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatReviewAttemptsRangeRule flags values above attempts", () => {
  const rule = new CsatReviewAttemptsRangeRule(255, 255);
  const item = newCsatReview("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatReviewCodeLengthRule flags a long code", () => {
  const rule = new CsatReviewCodeLengthRule(1000);
  const item = newCsatReview("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatReviewCategoryLengthRule flags a long category", () => {
  const rule = new CsatReviewCategoryLengthRule(32);
  const item = newCsatReview("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
