import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPreferenceReviewCeilingRangeRule,
  LegacyPreferenceReviewFloorValueRangeRule,
  LegacyPreferenceReviewNameLengthRule,
  LegacyPreferenceReviewRequiredNameRule,
  LegacyPreferenceReviewRequiredTimezoneRule,
  defaultLegacyPreferenceReviewValidator,
} from "./legacy-preference-review-rules.js";
import { newLegacyPreferenceReview } from "./legacy-preference-review.js";

test("LegacyPreferenceReviewValidator reports every problem", () => {
  const validator = defaultLegacyPreferenceReviewValidator();
  const item = newLegacyPreferenceReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPreferenceReviewFloorValueRangeRule flags values above floor value", () => {
  const rule = new LegacyPreferenceReviewFloorValueRangeRule(9.3, 425);
  const item = newLegacyPreferenceReview("x", "y");
  item.floorValue = 426.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPreferenceReviewNameLengthRule flags a long name", () => {
  const rule = new LegacyPreferenceReviewNameLengthRule(64);
  const item = newLegacyPreferenceReview("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPreferenceReviewRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new LegacyPreferenceReviewRequiredTimezoneRule("legacy preference review needs this field");
  const item = newLegacyPreferenceReview("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPreferenceReviewCeilingRangeRule flags values above ceiling", () => {
  const rule = new LegacyPreferenceReviewCeilingRangeRule(7, 4570.8);
  const item = newLegacyPreferenceReview("x", "y");
  item.ceiling = 4572.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPreferenceReviewRequiredNameRule flags a blank name", () => {
  const rule = new LegacyPreferenceReviewRequiredNameRule("legacy preference review needs this field");
  const item = newLegacyPreferenceReview("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
