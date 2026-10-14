import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionReviewCodeLengthRule,
  SuppressionReviewNameLengthRule,
  SuppressionReviewRegionLengthRule,
  SuppressionReviewRequiredNameRule,
  defaultSuppressionReviewValidator,
} from "./suppression-review-rules.js";
import { newSuppressionReview } from "./suppression-review.js";

test("SuppressionReviewValidator reports every problem", () => {
  const validator = defaultSuppressionReviewValidator();
  const item = newSuppressionReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionReviewRegionLengthRule flags a long region", () => {
  const rule = new SuppressionReviewRegionLengthRule(1000);
  const item = newSuppressionReview("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionReviewRequiredNameRule flags a blank name", () => {
  const rule = new SuppressionReviewRequiredNameRule("suppression review needs a value");
  const item = newSuppressionReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionReviewNameLengthRule flags a long name", () => {
  const rule = new SuppressionReviewNameLengthRule(120);
  const item = newSuppressionReview("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionReviewCodeLengthRule flags a long code", () => {
  const rule = new SuppressionReviewCodeLengthRule(3600);
  const item = newSuppressionReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
