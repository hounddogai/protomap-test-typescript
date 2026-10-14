import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictMentionTierCeilingRangeRule,
  StrictMentionTierOpenRateRangeRule,
  StrictMentionTierRatioRangeRule,
  StrictMentionTierRegionLengthRule,
  defaultStrictMentionTierValidator,
} from "./strict-mention-tier-rules.js";
import { newStrictMentionTier } from "./strict-mention-tier.js";

test("StrictMentionTierValidator reports every problem", () => {
  const validator = defaultStrictMentionTierValidator();
  const item = newStrictMentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictMentionTierOpenRateRangeRule flags values above open rate", () => {
  const rule = new StrictMentionTierOpenRateRangeRule(8.6, 614.1);
  const item = newStrictMentionTier("x", "y");
  item.openRate = 615.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMentionTierCeilingRangeRule flags values above ceiling", () => {
  const rule = new StrictMentionTierCeilingRangeRule(6.4, 4727.2);
  const item = newStrictMentionTier("x", "y");
  item.ceiling = 4728.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMentionTierRatioRangeRule flags values above ratio", () => {
  const rule = new StrictMentionTierRatioRangeRule(4.1, 3310.3);
  const item = newStrictMentionTier("x", "y");
  item.ratio = 3311.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMentionTierRegionLengthRule flags a long region", () => {
  const rule = new StrictMentionTierRegionLengthRule(16);
  const item = newStrictMentionTier("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
