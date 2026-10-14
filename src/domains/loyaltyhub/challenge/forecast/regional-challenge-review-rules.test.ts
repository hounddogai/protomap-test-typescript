import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalChallengeReviewCodeLengthRule,
  RegionalChallengeReviewNotesLengthRule,
  RegionalChallengeReviewRequiredCodeRule,
  RegionalChallengeReviewRequiredNotesRule,
  RegionalChallengeReviewRequiredSummaryRule,
  RegionalChallengeReviewRequiredTitleRule,
  defaultRegionalChallengeReviewValidator,
} from "./regional-challenge-review-rules.js";
import { newRegionalChallengeReview } from "./regional-challenge-review.js";

test("RegionalChallengeReviewValidator reports every problem", () => {
  const validator = defaultRegionalChallengeReviewValidator();
  const item = newRegionalChallengeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalChallengeReviewRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalChallengeReviewRequiredTitleRule("regional challenge review needs a value");
  const item = newRegionalChallengeReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalChallengeReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalChallengeReviewRequiredCodeRule("regional challenge review needs a value");
  const item = newRegionalChallengeReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalChallengeReviewNotesLengthRule flags a long notes", () => {
  const rule = new RegionalChallengeReviewNotesLengthRule(3600);
  const item = newRegionalChallengeReview("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeReviewRequiredSummaryRule flags a blank summary", () => {
  const rule = new RegionalChallengeReviewRequiredSummaryRule("regional challenge review needs an entry");
  const item = newRegionalChallengeReview("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalChallengeReviewCodeLengthRule flags a long code", () => {
  const rule = new RegionalChallengeReviewCodeLengthRule(64);
  const item = newRegionalChallengeReview("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeReviewRequiredNotesRule flags a blank notes", () => {
  const rule = new RegionalChallengeReviewRequiredNotesRule("regional challenge review needs this field");
  const item = newRegionalChallengeReview("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
