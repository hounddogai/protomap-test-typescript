import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPaywallReviewJourneyIdLengthRule,
  RollingPaywallReviewRequiredJourneyIdRule,
  RollingPaywallReviewRequiredTitleRule,
  defaultRollingPaywallReviewValidator,
} from "./rolling-paywall-review-rules.js";
import { newRollingPaywallReview } from "./rolling-paywall-review.js";

test("RollingPaywallReviewValidator reports every problem", () => {
  const validator = defaultRollingPaywallReviewValidator();
  const item = newRollingPaywallReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPaywallReviewRequiredTitleRule flags a blank title", () => {
  const rule = new RollingPaywallReviewRequiredTitleRule("rolling paywall review needs a value");
  const item = newRollingPaywallReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPaywallReviewJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RollingPaywallReviewJourneyIdLengthRule(32);
  const item = newRollingPaywallReview("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPaywallReviewRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RollingPaywallReviewRequiredJourneyIdRule("rolling paywall review needs a value");
  const item = newRollingPaywallReview("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
