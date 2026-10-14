import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRedemptionBundleRequiredReviewerRule,
  LegacyRedemptionBundleRetriesRangeRule,
  LegacyRedemptionBundleReviewerLengthRule,
  LegacyRedemptionBundleUnitLengthRule,
  defaultLegacyRedemptionBundleValidator,
} from "./legacy-redemption-bundle-rules.js";
import { newLegacyRedemptionBundle } from "./legacy-redemption-bundle.js";

test("LegacyRedemptionBundleValidator reports every problem", () => {
  const validator = defaultLegacyRedemptionBundleValidator();
  const item = newLegacyRedemptionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRedemptionBundleReviewerLengthRule flags a long reviewer", () => {
  const rule = new LegacyRedemptionBundleReviewerLengthRule(32);
  const item = newLegacyRedemptionBundle("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyRedemptionBundleRetriesRangeRule flags values above retries", () => {
  const rule = new LegacyRedemptionBundleRetriesRangeRule(255, 3600);
  const item = newLegacyRedemptionBundle("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRedemptionBundleRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new LegacyRedemptionBundleRequiredReviewerRule("legacy redemption bundle needs an entry");
  const item = newLegacyRedemptionBundle("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyRedemptionBundleUnitLengthRule flags a long unit", () => {
  const rule = new LegacyRedemptionBundleUnitLengthRule(32);
  const item = newLegacyRedemptionBundle("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
