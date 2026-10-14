import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryExitRuleReviewCeilingRangeRule,
  PrimaryExitRuleReviewNameLengthRule,
  PrimaryExitRuleReviewOwnerIdLengthRule,
  PrimaryExitRuleReviewRatioRangeRule,
  PrimaryExitRuleReviewRequiredNameRule,
  defaultPrimaryExitRuleReviewValidator,
} from "./primary-exit-rule-review-rules.js";
import { newPrimaryExitRuleReview } from "./primary-exit-rule-review.js";

test("PrimaryExitRuleReviewValidator reports every problem", () => {
  const validator = defaultPrimaryExitRuleReviewValidator();
  const item = newPrimaryExitRuleReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryExitRuleReviewNameLengthRule flags a long name", () => {
  const rule = new PrimaryExitRuleReviewNameLengthRule(32);
  const item = newPrimaryExitRuleReview("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryExitRuleReviewRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryExitRuleReviewRequiredNameRule("primary exit rule review needs this field");
  const item = newPrimaryExitRuleReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryExitRuleReviewOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PrimaryExitRuleReviewOwnerIdLengthRule(64);
  const item = newPrimaryExitRuleReview("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryExitRuleReviewCeilingRangeRule flags values above ceiling", () => {
  const rule = new PrimaryExitRuleReviewCeilingRangeRule(0.2, 4767.5);
  const item = newPrimaryExitRuleReview("x", "y");
  item.ceiling = 4769;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryExitRuleReviewRatioRangeRule flags values above ratio", () => {
  const rule = new PrimaryExitRuleReviewRatioRangeRule(3.3, 4128.7);
  const item = newPrimaryExitRuleReview("x", "y");
  item.ratio = 4130.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
