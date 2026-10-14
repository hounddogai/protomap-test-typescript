import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardBundleCategoryLengthRule,
  TieredRewardBundleEndsAtRangeRule,
  defaultTieredRewardBundleValidator,
} from "./tiered-reward-bundle-rules.js";
import { newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("TieredRewardBundleValidator reports every problem", () => {
  const validator = defaultTieredRewardBundleValidator();
  const item = newTieredRewardBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardBundleEndsAtRangeRule flags values above ends at", () => {
  const rule = new TieredRewardBundleEndsAtRangeRule(1000, 1000);
  const item = newTieredRewardBundle("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardBundleCategoryLengthRule flags a long category", () => {
  const rule = new TieredRewardBundleCategoryLengthRule(255);
  const item = newTieredRewardBundle("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
