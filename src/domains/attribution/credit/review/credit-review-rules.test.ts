import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditReviewQuantityRangeRule,
  CreditReviewRequiredLabelRule,
  CreditReviewRequiredVariantRule,
  CreditReviewRetriesRangeRule,
  CreditReviewVariantLengthRule,
  defaultCreditReviewValidator,
} from "./credit-review-rules.js";
import { newCreditReview } from "./credit-review.js";

test("CreditReviewValidator reports every problem", () => {
  const validator = defaultCreditReviewValidator();
  const item = newCreditReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditReviewRetriesRangeRule flags values above retries", () => {
  const rule = new CreditReviewRetriesRangeRule(64, 1000);
  const item = newCreditReview("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditReviewRequiredLabelRule flags a blank label", () => {
  const rule = new CreditReviewRequiredLabelRule("credit review needs an entry");
  const item = newCreditReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditReviewRequiredVariantRule flags a blank variant", () => {
  const rule = new CreditReviewRequiredVariantRule("credit review needs this field");
  const item = newCreditReview("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditReviewQuantityRangeRule flags values above quantity", () => {
  const rule = new CreditReviewQuantityRangeRule(32, 80);
  const item = newCreditReview("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditReviewVariantLengthRule flags a long variant", () => {
  const rule = new CreditReviewVariantLengthRule(1000);
  const item = newCreditReview("x", "y");
  item.variant = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
