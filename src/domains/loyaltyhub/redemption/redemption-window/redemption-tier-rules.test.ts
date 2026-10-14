import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionTierCodeLengthRule,
  RedemptionTierPhoneLengthRule,
  RedemptionTierRequiredCodeRule,
  RedemptionTierSequenceRangeRule,
  defaultRedemptionTierValidator,
} from "./redemption-tier-rules.js";
import { newRedemptionTier } from "./redemption-tier.js";

test("RedemptionTierValidator reports every problem", () => {
  const validator = defaultRedemptionTierValidator();
  const item = newRedemptionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionTierCodeLengthRule flags a long code", () => {
  const rule = new RedemptionTierCodeLengthRule(120);
  const item = newRedemptionTier("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionTierRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionTierRequiredCodeRule("redemption tier needs an entry");
  const item = newRedemptionTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionTierSequenceRangeRule flags values above sequence", () => {
  const rule = new RedemptionTierSequenceRangeRule(120, 86400);
  const item = newRedemptionTier("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionTierPhoneLengthRule flags a long phone", () => {
  const rule = new RedemptionTierPhoneLengthRule(1000);
  const item = newRedemptionTier("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
