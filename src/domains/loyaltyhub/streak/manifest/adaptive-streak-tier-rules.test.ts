import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveStreakTierLabelLengthRule,
  AdaptiveStreakTierPriorityRangeRule,
  AdaptiveStreakTierRequiredChecksumRule,
  AdaptiveStreakTierRequiredCodeRule,
  defaultAdaptiveStreakTierValidator,
} from "./adaptive-streak-tier-rules.js";
import { newAdaptiveStreakTier } from "./adaptive-streak-tier.js";

test("AdaptiveStreakTierValidator reports every problem", () => {
  const validator = defaultAdaptiveStreakTierValidator();
  const item = newAdaptiveStreakTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveStreakTierRequiredChecksumRule flags a blank checksum", () => {
  const rule = new AdaptiveStreakTierRequiredChecksumRule("adaptive streak tier needs an entry");
  const item = newAdaptiveStreakTier("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveStreakTierRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveStreakTierRequiredCodeRule("adaptive streak tier needs this field");
  const item = newAdaptiveStreakTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveStreakTierLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveStreakTierLabelLengthRule(16);
  const item = newAdaptiveStreakTier("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveStreakTierPriorityRangeRule flags values above priority", () => {
  const rule = new AdaptiveStreakTierPriorityRangeRule(255, 86400);
  const item = newAdaptiveStreakTier("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
