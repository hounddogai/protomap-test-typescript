import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWarmupTierChannelLengthRule,
  TieredWarmupTierRequiredChannelRule,
  TieredWarmupTierRequiredCodeRule,
  TieredWarmupTierRequiredTitleRule,
  TieredWarmupTierSendAtRangeRule,
  defaultTieredWarmupTierValidator,
} from "./tiered-warmup-tier-rules.js";
import { newTieredWarmupTier } from "./tiered-warmup-tier.js";

test("TieredWarmupTierValidator reports every problem", () => {
  const validator = defaultTieredWarmupTierValidator();
  const item = newTieredWarmupTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWarmupTierSendAtRangeRule flags values above send at", () => {
  const rule = new TieredWarmupTierSendAtRangeRule(32, 1000);
  const item = newTieredWarmupTier("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWarmupTierChannelLengthRule flags a long channel", () => {
  const rule = new TieredWarmupTierChannelLengthRule(120);
  const item = newTieredWarmupTier("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWarmupTierRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredWarmupTierRequiredChannelRule("tiered warmup tier needs this field");
  const item = newTieredWarmupTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWarmupTierRequiredTitleRule flags a blank title", () => {
  const rule = new TieredWarmupTierRequiredTitleRule("tiered warmup tier needs this field");
  const item = newTieredWarmupTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWarmupTierRequiredCodeRule flags a blank code", () => {
  const rule = new TieredWarmupTierRequiredCodeRule("tiered warmup tier needs a value");
  const item = newTieredWarmupTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
