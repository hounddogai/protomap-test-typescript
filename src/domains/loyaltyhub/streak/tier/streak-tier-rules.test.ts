import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakTierChannelLengthRule,
  StreakTierFrequencyCapRangeRule,
  StreakTierRequiredChannelRule,
  StreakTierRequiredCodeRule,
  StreakTierTitleLengthRule,
  defaultStreakTierValidator,
} from "./streak-tier-rules.js";
import { newStreakTier } from "./streak-tier.js";

test("StreakTierValidator reports every problem", () => {
  const validator = defaultStreakTierValidator();
  const item = newStreakTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakTierFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new StreakTierFrequencyCapRangeRule(255, 1000);
  const item = newStreakTier("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakTierRequiredCodeRule flags a blank code", () => {
  const rule = new StreakTierRequiredCodeRule("streak tier needs a value");
  const item = newStreakTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakTierTitleLengthRule flags a long title", () => {
  const rule = new StreakTierTitleLengthRule(120);
  const item = newStreakTier("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakTierChannelLengthRule flags a long channel", () => {
  const rule = new StreakTierChannelLengthRule(16);
  const item = newStreakTier("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakTierRequiredChannelRule flags a blank channel", () => {
  const rule = new StreakTierRequiredChannelRule("streak tier needs an entry");
  const item = newStreakTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
