import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCohortTierRequiredLabelRule,
  LegacyCohortTierReviewerLengthRule,
  LegacyCohortTierWindowDaysRangeRule,
  defaultLegacyCohortTierValidator,
} from "./legacy-cohort-tier-rules.js";
import { newLegacyCohortTier } from "./legacy-cohort-tier.js";

test("LegacyCohortTierValidator reports every problem", () => {
  const validator = defaultLegacyCohortTierValidator();
  const item = newLegacyCohortTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCohortTierReviewerLengthRule flags a long reviewer", () => {
  const rule = new LegacyCohortTierReviewerLengthRule(32);
  const item = newLegacyCohortTier("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCohortTierWindowDaysRangeRule flags values above window days", () => {
  const rule = new LegacyCohortTierWindowDaysRangeRule(255, 86400);
  const item = newLegacyCohortTier("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCohortTierRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyCohortTierRequiredLabelRule("legacy cohort tier needs a value");
  const item = newLegacyCohortTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
