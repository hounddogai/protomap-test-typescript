import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReplyVarianceGraceDaysRangeRule,
  TieredReplyVarianceRequiredReviewerRule,
  TieredReplyVarianceReviewerLengthRule,
  TieredReplyVarianceTitleLengthRule,
  defaultTieredReplyVarianceValidator,
} from "./tiered-reply-variance-rules.js";
import { newTieredReplyVariance } from "./tiered-reply-variance.js";

test("TieredReplyVarianceValidator reports every problem", () => {
  const validator = defaultTieredReplyVarianceValidator();
  const item = newTieredReplyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReplyVarianceTitleLengthRule flags a long title", () => {
  const rule = new TieredReplyVarianceTitleLengthRule(32);
  const item = newTieredReplyVariance("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredReplyVarianceGraceDaysRangeRule flags values above grace days", () => {
  const rule = new TieredReplyVarianceGraceDaysRangeRule(16, 3600);
  const item = newTieredReplyVariance("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredReplyVarianceRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new TieredReplyVarianceRequiredReviewerRule("tiered reply variance needs this field");
  const item = newTieredReplyVariance("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredReplyVarianceReviewerLengthRule flags a long reviewer", () => {
  const rule = new TieredReplyVarianceReviewerLengthRule(16);
  const item = newTieredReplyVariance("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
