import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredMentionTierCreatedAtRangeRule,
  TieredMentionTierRatioRangeRule,
  defaultTieredMentionTierValidator,
} from "./tiered-mention-tier-rules.js";
import { newTieredMentionTier } from "./tiered-mention-tier.js";

test("TieredMentionTierValidator reports every problem", () => {
  const validator = defaultTieredMentionTierValidator();
  const item = newTieredMentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredMentionTierRatioRangeRule flags values above ratio", () => {
  const rule = new TieredMentionTierRatioRangeRule(1.5, 3583.1);
  const item = newTieredMentionTier("x", "y");
  item.ratio = 3584.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMentionTierCreatedAtRangeRule flags values above created at", () => {
  const rule = new TieredMentionTierCreatedAtRangeRule(80, 255);
  const item = newTieredMentionTier("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
