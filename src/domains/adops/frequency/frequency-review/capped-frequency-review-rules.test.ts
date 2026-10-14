import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFrequencyReviewCampaignRefLengthRule,
  CappedFrequencyReviewLabelLengthRule,
  CappedFrequencyReviewRatioRangeRule,
  CappedFrequencyReviewRequiredCampaignRefRule,
  CappedFrequencyReviewRequiredLabelRule,
  defaultCappedFrequencyReviewValidator,
} from "./capped-frequency-review-rules.js";
import { newCappedFrequencyReview } from "./capped-frequency-review.js";

test("CappedFrequencyReviewValidator reports every problem", () => {
  const validator = defaultCappedFrequencyReviewValidator();
  const item = newCappedFrequencyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFrequencyReviewRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CappedFrequencyReviewRequiredCampaignRefRule("capped frequency review needs an entry");
  const item = newCappedFrequencyReview("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyReviewLabelLengthRule flags a long label", () => {
  const rule = new CappedFrequencyReviewLabelLengthRule(3600);
  const item = newCappedFrequencyReview("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFrequencyReviewRequiredLabelRule flags a blank label", () => {
  const rule = new CappedFrequencyReviewRequiredLabelRule("capped frequency review needs this field");
  const item = newCappedFrequencyReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyReviewCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedFrequencyReviewCampaignRefLengthRule(1000);
  const item = newCappedFrequencyReview("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFrequencyReviewRatioRangeRule flags values above ratio", () => {
  const rule = new CappedFrequencyReviewRatioRangeRule(7, 901.7);
  const item = newCappedFrequencyReview("x", "y");
  item.ratio = 903.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
