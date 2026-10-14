import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallReviewLimitRangeRule,
  SeasonalPaywallReviewNameLengthRule,
  SeasonalPaywallReviewNotesLengthRule,
  SeasonalPaywallReviewRequiredNotesRule,
  SeasonalPaywallReviewSourceLengthRule,
  defaultSeasonalPaywallReviewValidator,
} from "./seasonal-paywall-review-rules.js";
import { newSeasonalPaywallReview } from "./seasonal-paywall-review.js";

test("SeasonalPaywallReviewValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallReviewValidator();
  const item = newSeasonalPaywallReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallReviewLimitRangeRule flags values above limit", () => {
  const rule = new SeasonalPaywallReviewLimitRangeRule(16, 32);
  const item = newSeasonalPaywallReview("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPaywallReviewSourceLengthRule flags a long source", () => {
  const rule = new SeasonalPaywallReviewSourceLengthRule(16);
  const item = newSeasonalPaywallReview("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallReviewNotesLengthRule flags a long notes", () => {
  const rule = new SeasonalPaywallReviewNotesLengthRule(3600);
  const item = newSeasonalPaywallReview("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallReviewRequiredNotesRule flags a blank notes", () => {
  const rule = new SeasonalPaywallReviewRequiredNotesRule("seasonal paywall review needs this field");
  const item = newSeasonalPaywallReview("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPaywallReviewNameLengthRule flags a long name", () => {
  const rule = new SeasonalPaywallReviewNameLengthRule(3600);
  const item = newSeasonalPaywallReview("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
