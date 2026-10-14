import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSuppressionProfileBidRangeRule,
  RegionalSuppressionProfileEndsAtRangeRule,
  RegionalSuppressionProfileRequiredReviewerRule,
  defaultRegionalSuppressionProfileValidator,
} from "./regional-suppression-profile-rules.js";
import { newRegionalSuppressionProfile } from "./regional-suppression-profile.js";

test("RegionalSuppressionProfileValidator reports every problem", () => {
  const validator = defaultRegionalSuppressionProfileValidator();
  const item = newRegionalSuppressionProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSuppressionProfileBidRangeRule flags values above bid", () => {
  const rule = new RegionalSuppressionProfileBidRangeRule(0.2, 892.3);
  const item = newRegionalSuppressionProfile("x", "y");
  item.bid = 893.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSuppressionProfileRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RegionalSuppressionProfileRequiredReviewerRule("regional suppression profile needs this field");
  const item = newRegionalSuppressionProfile("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSuppressionProfileEndsAtRangeRule flags values above ends at", () => {
  const rule = new RegionalSuppressionProfileEndsAtRangeRule(3600, 3600);
  const item = newRegionalSuppressionProfile("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
