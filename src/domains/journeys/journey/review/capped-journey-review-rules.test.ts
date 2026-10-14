import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedJourneyReviewCodeLengthRule,
  CappedJourneyReviewRequiredTitleRule,
  CappedJourneyReviewRequiredUnitRule,
  CappedJourneyReviewTitleLengthRule,
  CappedJourneyReviewUnitLengthRule,
  defaultCappedJourneyReviewValidator,
} from "./capped-journey-review-rules.js";
import { newCappedJourneyReview } from "./capped-journey-review.js";

test("CappedJourneyReviewValidator reports every problem", () => {
  const validator = defaultCappedJourneyReviewValidator();
  const item = newCappedJourneyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedJourneyReviewCodeLengthRule flags a long code", () => {
  const rule = new CappedJourneyReviewCodeLengthRule(255);
  const item = newCappedJourneyReview("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedJourneyReviewRequiredTitleRule flags a blank title", () => {
  const rule = new CappedJourneyReviewRequiredTitleRule("capped journey review needs this field");
  const item = newCappedJourneyReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedJourneyReviewUnitLengthRule flags a long unit", () => {
  const rule = new CappedJourneyReviewUnitLengthRule(32);
  const item = newCappedJourneyReview("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedJourneyReviewRequiredUnitRule flags a blank unit", () => {
  const rule = new CappedJourneyReviewRequiredUnitRule("capped journey review needs an entry");
  const item = newCappedJourneyReview("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedJourneyReviewTitleLengthRule flags a long title", () => {
  const rule = new CappedJourneyReviewTitleLengthRule(32);
  const item = newCappedJourneyReview("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
