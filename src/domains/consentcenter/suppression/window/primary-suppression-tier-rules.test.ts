import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySuppressionTierRegionLengthRule,
  PrimarySuppressionTierRevisionRangeRule,
  defaultPrimarySuppressionTierValidator,
} from "./primary-suppression-tier-rules.js";
import { newPrimarySuppressionTier } from "./primary-suppression-tier.js";

test("PrimarySuppressionTierValidator reports every problem", () => {
  const validator = defaultPrimarySuppressionTierValidator();
  const item = newPrimarySuppressionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySuppressionTierRevisionRangeRule flags values above revision", () => {
  const rule = new PrimarySuppressionTierRevisionRangeRule(64, 3600);
  const item = newPrimarySuppressionTier("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySuppressionTierRegionLengthRule flags a long region", () => {
  const rule = new PrimarySuppressionTierRegionLengthRule(32);
  const item = newPrimarySuppressionTier("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
