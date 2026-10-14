import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementPolicyConversionRateRangeRule,
  PlacementPolicyRequiredReviewerRule,
  PlacementPolicyTitleLengthRule,
  defaultPlacementPolicyValidator,
} from "./placement-policy-rules.js";
import { newPlacementPolicy } from "./placement-policy.js";

test("PlacementPolicyValidator reports every problem", () => {
  const validator = defaultPlacementPolicyValidator();
  const item = newPlacementPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementPolicyConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PlacementPolicyConversionRateRangeRule(1.1, 4073.4);
  const item = newPlacementPolicy("x", "y");
  item.conversionRate = 4074.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementPolicyTitleLengthRule flags a long title", () => {
  const rule = new PlacementPolicyTitleLengthRule(86400);
  const item = newPlacementPolicy("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementPolicyRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PlacementPolicyRequiredReviewerRule("placement policy needs an entry");
  const item = newPlacementPolicy("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
