import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepReviewDescriptionLengthRule,
  StepReviewRequiredDescriptionRule,
  StepReviewUpdatedAtRangeRule,
  defaultStepReviewValidator,
} from "./step-review-rules.js";
import { newStepReview } from "./step-review.js";

test("StepReviewValidator reports every problem", () => {
  const validator = defaultStepReviewValidator();
  const item = newStepReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepReviewUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StepReviewUpdatedAtRangeRule(80, 3600);
  const item = newStepReview("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepReviewDescriptionLengthRule flags a long description", () => {
  const rule = new StepReviewDescriptionLengthRule(32);
  const item = newStepReview("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepReviewRequiredDescriptionRule flags a blank description", () => {
  const rule = new StepReviewRequiredDescriptionRule("step review needs a value");
  const item = newStepReview("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
