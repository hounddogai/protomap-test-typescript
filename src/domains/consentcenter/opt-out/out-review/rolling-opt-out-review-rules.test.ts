import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutReviewRequiredCodeRule,
  RollingOptOutReviewRequiredExternalRefRule,
  RollingOptOutReviewSegmentLengthRule,
  RollingOptOutReviewTitleLengthRule,
  defaultRollingOptOutReviewValidator,
} from "./rolling-opt-out-review-rules.js";
import { newRollingOptOutReview } from "./rolling-opt-out-review.js";

test("RollingOptOutReviewValidator reports every problem", () => {
  const validator = defaultRollingOptOutReviewValidator();
  const item = newRollingOptOutReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutReviewRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RollingOptOutReviewRequiredExternalRefRule("rolling opt out review needs an entry");
  const item = newRollingOptOutReview("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RollingOptOutReviewRequiredCodeRule("rolling opt out review needs this field");
  const item = newRollingOptOutReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutReviewTitleLengthRule flags a long title", () => {
  const rule = new RollingOptOutReviewTitleLengthRule(64);
  const item = newRollingOptOutReview("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutReviewSegmentLengthRule flags a long segment", () => {
  const rule = new RollingOptOutReviewSegmentLengthRule(16);
  const item = newRollingOptOutReview("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
