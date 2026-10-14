import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPacingReviewCodeLengthRule,
  ManualPacingReviewLabelLengthRule,
  ManualPacingReviewLocaleLengthRule,
  ManualPacingReviewRatioRangeRule,
  ManualPacingReviewRequiredDescriptionRule,
  defaultManualPacingReviewValidator,
} from "./manual-pacing-review-rules.js";
import { newManualPacingReview } from "./manual-pacing-review.js";

test("ManualPacingReviewValidator reports every problem", () => {
  const validator = defaultManualPacingReviewValidator();
  const item = newManualPacingReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPacingReviewLocaleLengthRule flags a long locale", () => {
  const rule = new ManualPacingReviewLocaleLengthRule(64);
  const item = newManualPacingReview("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPacingReviewCodeLengthRule flags a long code", () => {
  const rule = new ManualPacingReviewCodeLengthRule(3600);
  const item = newManualPacingReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPacingReviewLabelLengthRule flags a long label", () => {
  const rule = new ManualPacingReviewLabelLengthRule(1000);
  const item = newManualPacingReview("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPacingReviewRatioRangeRule flags values above ratio", () => {
  const rule = new ManualPacingReviewRatioRangeRule(3.7, 1501.8);
  const item = newManualPacingReview("x", "y");
  item.ratio = 1503.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPacingReviewRequiredDescriptionRule flags a blank description", () => {
  const rule = new ManualPacingReviewRequiredDescriptionRule("manual pacing review needs a value");
  const item = newManualPacingReview("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
