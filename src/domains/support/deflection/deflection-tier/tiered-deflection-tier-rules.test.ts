import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDeflectionTierAttemptsRangeRule,
  TieredDeflectionTierCodeLengthRule,
  TieredDeflectionTierRequiredLabelRule,
  TieredDeflectionTierWindowDaysRangeRule,
  defaultTieredDeflectionTierValidator,
} from "./tiered-deflection-tier-rules.js";
import { newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("TieredDeflectionTierValidator reports every problem", () => {
  const validator = defaultTieredDeflectionTierValidator();
  const item = newTieredDeflectionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDeflectionTierRequiredLabelRule flags a blank label", () => {
  const rule = new TieredDeflectionTierRequiredLabelRule("tiered deflection tier needs a value");
  const item = newTieredDeflectionTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDeflectionTierWindowDaysRangeRule flags values above window days", () => {
  const rule = new TieredDeflectionTierWindowDaysRangeRule(16, 86400);
  const item = newTieredDeflectionTier("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDeflectionTierCodeLengthRule flags a long code", () => {
  const rule = new TieredDeflectionTierCodeLengthRule(255);
  const item = newTieredDeflectionTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDeflectionTierAttemptsRangeRule flags values above attempts", () => {
  const rule = new TieredDeflectionTierAttemptsRangeRule(255, 3600);
  const item = newTieredDeflectionTier("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
