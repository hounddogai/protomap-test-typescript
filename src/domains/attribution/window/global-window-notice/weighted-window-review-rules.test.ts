import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWindowReviewCampaignRefLengthRule,
  WeightedWindowReviewCreatedAtRangeRule,
  WeightedWindowReviewRequiredCampaignRefRule,
  WeightedWindowReviewRequiredCodeRule,
  WeightedWindowReviewSendAtRangeRule,
  defaultWeightedWindowReviewValidator,
} from "./weighted-window-review-rules.js";
import { newWeightedWindowReview } from "./weighted-window-review.js";

test("WeightedWindowReviewValidator reports every problem", () => {
  const validator = defaultWeightedWindowReviewValidator();
  const item = newWeightedWindowReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWindowReviewCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new WeightedWindowReviewCampaignRefLengthRule(80);
  const item = newWeightedWindowReview("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWindowReviewRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WeightedWindowReviewRequiredCampaignRefRule("weighted window review needs this field");
  const item = newWeightedWindowReview("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWindowReviewSendAtRangeRule flags values above send at", () => {
  const rule = new WeightedWindowReviewSendAtRangeRule(80, 3600);
  const item = newWeightedWindowReview("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWindowReviewCreatedAtRangeRule flags values above created at", () => {
  const rule = new WeightedWindowReviewCreatedAtRangeRule(64, 3600);
  const item = newWeightedWindowReview("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWindowReviewRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedWindowReviewRequiredCodeRule("weighted window review needs this field");
  const item = newWeightedWindowReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
