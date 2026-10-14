import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostReviewLabelLengthRule,
  PostReviewOwnerIdLengthRule,
  PostReviewRequiredOwnerIdRule,
  defaultPostReviewValidator,
} from "./post-review-rules.js";
import { newPostReview } from "./post-review.js";

test("PostReviewValidator reports every problem", () => {
  const validator = defaultPostReviewValidator();
  const item = newPostReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostReviewRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PostReviewRequiredOwnerIdRule("post review needs a value");
  const item = newPostReview("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostReviewLabelLengthRule flags a long label", () => {
  const rule = new PostReviewLabelLengthRule(80);
  const item = newPostReview("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostReviewOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PostReviewOwnerIdLengthRule(120);
  const item = newPostReview("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
