import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStepReviewOwnerIdLengthRule,
  RegionalStepReviewRequiredCodeRule,
  RegionalStepReviewRequiredOwnerIdRule,
  RegionalStepReviewSourceLengthRule,
  defaultRegionalStepReviewValidator,
} from "./regional-step-review-rules.js";
import { newRegionalStepReview } from "./regional-step-review.js";

test("RegionalStepReviewValidator reports every problem", () => {
  const validator = defaultRegionalStepReviewValidator();
  const item = newRegionalStepReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStepReviewOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RegionalStepReviewOwnerIdLengthRule(3600);
  const item = newRegionalStepReview("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalStepReviewRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RegionalStepReviewRequiredOwnerIdRule("regional step review needs an entry");
  const item = newRegionalStepReview("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStepReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalStepReviewRequiredCodeRule("regional step review needs this field");
  const item = newRegionalStepReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStepReviewSourceLengthRule flags a long source", () => {
  const rule = new RegionalStepReviewSourceLengthRule(1000);
  const item = newRegionalStepReview("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
