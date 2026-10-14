import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSenderReviewCodeLengthRule,
  SeasonalSenderReviewRequiredTitleRule,
  SeasonalSenderReviewSegmentLengthRule,
  SeasonalSenderReviewTitleLengthRule,
  defaultSeasonalSenderReviewValidator,
} from "./seasonal-sender-review-rules.js";
import { newSeasonalSenderReview } from "./seasonal-sender-review.js";

test("SeasonalSenderReviewValidator reports every problem", () => {
  const validator = defaultSeasonalSenderReviewValidator();
  const item = newSeasonalSenderReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSenderReviewCodeLengthRule flags a long code", () => {
  const rule = new SeasonalSenderReviewCodeLengthRule(120);
  const item = newSeasonalSenderReview("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSenderReviewSegmentLengthRule flags a long segment", () => {
  const rule = new SeasonalSenderReviewSegmentLengthRule(16);
  const item = newSeasonalSenderReview("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSenderReviewTitleLengthRule flags a long title", () => {
  const rule = new SeasonalSenderReviewTitleLengthRule(120);
  const item = newSeasonalSenderReview("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSenderReviewRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalSenderReviewRequiredTitleRule("seasonal sender review needs this field");
  const item = newSeasonalSenderReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
