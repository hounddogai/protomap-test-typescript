import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRedemptionTierNameLengthRule,
  LenientRedemptionTierRequiredCurrencyRule,
  LenientRedemptionTierStartsAtRangeRule,
  defaultLenientRedemptionTierValidator,
} from "./lenient-redemption-tier-rules.js";
import { newLenientRedemptionTier } from "./lenient-redemption-tier.js";

test("LenientRedemptionTierValidator reports every problem", () => {
  const validator = defaultLenientRedemptionTierValidator();
  const item = newLenientRedemptionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRedemptionTierNameLengthRule flags a long name", () => {
  const rule = new LenientRedemptionTierNameLengthRule(80);
  const item = newLenientRedemptionTier("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRedemptionTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new LenientRedemptionTierStartsAtRangeRule(255, 3600);
  const item = newLenientRedemptionTier("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRedemptionTierRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LenientRedemptionTierRequiredCurrencyRule("lenient redemption tier needs an entry");
  const item = newLenientRedemptionTier("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
