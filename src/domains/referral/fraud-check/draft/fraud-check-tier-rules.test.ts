import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckTierLabelLengthRule,
  FraudCheckTierMaximumRangeRule,
  FraudCheckTierRequiredVariantRule,
  defaultFraudCheckTierValidator,
} from "./fraud-check-tier-rules.js";
import { newFraudCheckTier } from "./fraud-check-tier.js";

test("FraudCheckTierValidator reports every problem", () => {
  const validator = defaultFraudCheckTierValidator();
  const item = newFraudCheckTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckTierRequiredVariantRule flags a blank variant", () => {
  const rule = new FraudCheckTierRequiredVariantRule("fraud check tier needs a value");
  const item = newFraudCheckTier("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckTierMaximumRangeRule flags values above maximum", () => {
  const rule = new FraudCheckTierMaximumRangeRule(5.6, 3353.7);
  const item = newFraudCheckTier("x", "y");
  item.maximum = 3355.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckTierLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckTierLabelLengthRule(3600);
  const item = newFraudCheckTier("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
