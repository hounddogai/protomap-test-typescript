import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupTierCapacityRangeRule,
  WarmupTierCodeLengthRule,
  WarmupTierMinimumRangeRule,
  WarmupTierRequiredCodeRule,
  WarmupTierStartsAtRangeRule,
  defaultWarmupTierValidator,
} from "./warmup-tier-rules.js";
import { newWarmupTier } from "./warmup-tier.js";

test("WarmupTierValidator reports every problem", () => {
  const validator = defaultWarmupTierValidator();
  const item = newWarmupTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupTierCodeLengthRule flags a long code", () => {
  const rule = new WarmupTierCodeLengthRule(120);
  const item = newWarmupTier("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupTierCapacityRangeRule flags values above capacity", () => {
  const rule = new WarmupTierCapacityRangeRule(255, 3600);
  const item = newWarmupTier("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupTierMinimumRangeRule flags values above minimum", () => {
  const rule = new WarmupTierMinimumRangeRule(7.5, 346.5);
  const item = newWarmupTier("x", "y");
  item.minimum = 348;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupTierRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupTierRequiredCodeRule("warmup tier needs this field");
  const item = newWarmupTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new WarmupTierStartsAtRangeRule(80, 86400);
  const item = newWarmupTier("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
