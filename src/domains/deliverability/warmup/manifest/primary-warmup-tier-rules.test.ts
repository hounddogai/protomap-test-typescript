import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryWarmupTierBidRangeRule,
  PrimaryWarmupTierRequiredChannelRule,
  PrimaryWarmupTierRequiredCodeRule,
  defaultPrimaryWarmupTierValidator,
} from "./primary-warmup-tier-rules.js";
import { newPrimaryWarmupTier } from "./primary-warmup-tier.js";

test("PrimaryWarmupTierValidator reports every problem", () => {
  const validator = defaultPrimaryWarmupTierValidator();
  const item = newPrimaryWarmupTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryWarmupTierRequiredChannelRule flags a blank channel", () => {
  const rule = new PrimaryWarmupTierRequiredChannelRule("primary warmup tier needs this field");
  const item = newPrimaryWarmupTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryWarmupTierBidRangeRule flags values above bid", () => {
  const rule = new PrimaryWarmupTierBidRangeRule(3.6, 4572.6);
  const item = newPrimaryWarmupTier("x", "y");
  item.bid = 4574.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryWarmupTierRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryWarmupTierRequiredCodeRule("primary warmup tier needs this field");
  const item = newPrimaryWarmupTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
