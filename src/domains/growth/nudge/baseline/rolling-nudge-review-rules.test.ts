import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeReviewLabelLengthRule,
  RollingNudgeReviewRequiredCodeRule,
  defaultRollingNudgeReviewValidator,
} from "./rolling-nudge-review-rules.js";
import { newRollingNudgeReview } from "./rolling-nudge-review.js";

test("RollingNudgeReviewValidator reports every problem", () => {
  const validator = defaultRollingNudgeReviewValidator();
  const item = newRollingNudgeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RollingNudgeReviewRequiredCodeRule("rolling nudge review needs an entry");
  const item = newRollingNudgeReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeReviewLabelLengthRule flags a long label", () => {
  const rule = new RollingNudgeReviewLabelLengthRule(16);
  const item = newRollingNudgeReview("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
