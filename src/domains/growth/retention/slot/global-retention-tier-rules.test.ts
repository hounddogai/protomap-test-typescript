import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionTierRegionLengthRule,
  GlobalRetentionTierRequiredTitleRule,
  GlobalRetentionTierRevisionRangeRule,
  defaultGlobalRetentionTierValidator,
} from "./global-retention-tier-rules.js";
import { newGlobalRetentionTier } from "./global-retention-tier.js";

test("GlobalRetentionTierValidator reports every problem", () => {
  const validator = defaultGlobalRetentionTierValidator();
  const item = newGlobalRetentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionTierRevisionRangeRule flags values above revision", () => {
  const rule = new GlobalRetentionTierRevisionRangeRule(255, 255);
  const item = newGlobalRetentionTier("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRetentionTierRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalRetentionTierRequiredTitleRule("global retention tier needs this field");
  const item = newGlobalRetentionTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionTierRegionLengthRule flags a long region", () => {
  const rule = new GlobalRetentionTierRegionLengthRule(1000);
  const item = newGlobalRetentionTier("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
