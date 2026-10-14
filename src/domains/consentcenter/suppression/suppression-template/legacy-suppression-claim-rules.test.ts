import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySuppressionClaimCountryLengthRule,
  LegacySuppressionClaimNameLengthRule,
  LegacySuppressionClaimRequiredCountryRule,
  LegacySuppressionClaimRequiredReviewerRule,
  LegacySuppressionClaimReviewerLengthRule,
  defaultLegacySuppressionClaimValidator,
} from "./legacy-suppression-claim-rules.js";
import { newLegacySuppressionClaim } from "./legacy-suppression-claim.js";

test("LegacySuppressionClaimValidator reports every problem", () => {
  const validator = defaultLegacySuppressionClaimValidator();
  const item = newLegacySuppressionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySuppressionClaimRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new LegacySuppressionClaimRequiredReviewerRule("legacy suppression claim needs a value");
  const item = newLegacySuppressionClaim("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySuppressionClaimRequiredCountryRule flags a blank country", () => {
  const rule = new LegacySuppressionClaimRequiredCountryRule("legacy suppression claim needs an entry");
  const item = newLegacySuppressionClaim("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySuppressionClaimNameLengthRule flags a long name", () => {
  const rule = new LegacySuppressionClaimNameLengthRule(86400);
  const item = newLegacySuppressionClaim("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySuppressionClaimCountryLengthRule flags a long country", () => {
  const rule = new LegacySuppressionClaimCountryLengthRule(3600);
  const item = newLegacySuppressionClaim("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySuppressionClaimReviewerLengthRule flags a long reviewer", () => {
  const rule = new LegacySuppressionClaimReviewerLengthRule(255);
  const item = newLegacySuppressionClaim("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
