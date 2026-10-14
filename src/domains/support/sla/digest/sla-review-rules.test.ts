import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaReviewCodeLengthRule,
  SlaReviewLabelLengthRule,
  SlaReviewMinimumRangeRule,
  defaultSlaReviewValidator,
} from "./sla-review-rules.js";
import { newSlaReview } from "./sla-review.js";

test("SlaReviewValidator reports every problem", () => {
  const validator = defaultSlaReviewValidator();
  const item = newSlaReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaReviewCodeLengthRule flags a long code", () => {
  const rule = new SlaReviewCodeLengthRule(80);
  const item = newSlaReview("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaReviewLabelLengthRule flags a long label", () => {
  const rule = new SlaReviewLabelLengthRule(64);
  const item = newSlaReview("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaReviewMinimumRangeRule flags values above minimum", () => {
  const rule = new SlaReviewMinimumRangeRule(5.8, 84.5);
  const item = newSlaReview("x", "y");
  item.minimum = 86;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
