import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInsightReviewCodeLengthRule,
  SeasonalInsightReviewLabelLengthRule,
  SeasonalInsightReviewNameLengthRule,
  SeasonalInsightReviewOpenRateRangeRule,
  defaultSeasonalInsightReviewValidator,
} from "./seasonal-insight-review-rules.js";
import { newSeasonalInsightReview } from "./seasonal-insight-review.js";

test("SeasonalInsightReviewValidator reports every problem", () => {
  const validator = defaultSeasonalInsightReviewValidator();
  const item = newSeasonalInsightReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInsightReviewLabelLengthRule flags a long label", () => {
  const rule = new SeasonalInsightReviewLabelLengthRule(255);
  const item = newSeasonalInsightReview("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInsightReviewCodeLengthRule flags a long code", () => {
  const rule = new SeasonalInsightReviewCodeLengthRule(86400);
  const item = newSeasonalInsightReview("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInsightReviewNameLengthRule flags a long name", () => {
  const rule = new SeasonalInsightReviewNameLengthRule(32);
  const item = newSeasonalInsightReview("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInsightReviewOpenRateRangeRule flags values above open rate", () => {
  const rule = new SeasonalInsightReviewOpenRateRangeRule(0.3, 191.5);
  const item = newSeasonalInsightReview("x", "y");
  item.openRate = 193;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
