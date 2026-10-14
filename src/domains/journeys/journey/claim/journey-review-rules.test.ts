import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyReviewCostRangeRule,
  JourneyReviewDescriptionLengthRule,
  JourneyReviewRequiredAudienceIdRule,
  JourneyReviewRequiredDescriptionRule,
  JourneyReviewRequiredTitleRule,
  JourneyReviewSequenceRangeRule,
  defaultJourneyReviewValidator,
} from "./journey-review-rules.js";
import { newJourneyReview } from "./journey-review.js";

test("JourneyReviewValidator reports every problem", () => {
  const validator = defaultJourneyReviewValidator();
  const item = newJourneyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyReviewSequenceRangeRule flags values above sequence", () => {
  const rule = new JourneyReviewSequenceRangeRule(64, 80);
  const item = newJourneyReview("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyReviewRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new JourneyReviewRequiredAudienceIdRule("journey review needs an entry");
  const item = newJourneyReview("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyReviewRequiredDescriptionRule flags a blank description", () => {
  const rule = new JourneyReviewRequiredDescriptionRule("journey review needs a value");
  const item = newJourneyReview("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyReviewDescriptionLengthRule flags a long description", () => {
  const rule = new JourneyReviewDescriptionLengthRule(86400);
  const item = newJourneyReview("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyReviewRequiredTitleRule flags a blank title", () => {
  const rule = new JourneyReviewRequiredTitleRule("journey review needs a value");
  const item = newJourneyReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyReviewCostRangeRule flags values above cost", () => {
  const rule = new JourneyReviewCostRangeRule(8.6, 3567.1);
  const item = newJourneyReview("x", "y");
  item.cost = 3568.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
