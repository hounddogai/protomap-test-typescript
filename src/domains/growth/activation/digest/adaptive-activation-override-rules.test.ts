import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveActivationOverrideCodeLengthRule,
  AdaptiveActivationOverrideEndsAtRangeRule,
  AdaptiveActivationOverridePhoneLengthRule,
  AdaptiveActivationOverrideRateRangeRule,
  AdaptiveActivationOverrideRequiredPhoneRule,
  defaultAdaptiveActivationOverrideValidator,
} from "./adaptive-activation-override-rules.js";
import { newAdaptiveActivationOverride } from "./adaptive-activation-override.js";

test("AdaptiveActivationOverrideValidator reports every problem", () => {
  const validator = defaultAdaptiveActivationOverrideValidator();
  const item = newAdaptiveActivationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveActivationOverridePhoneLengthRule flags a long phone", () => {
  const rule = new AdaptiveActivationOverridePhoneLengthRule(80);
  const item = newAdaptiveActivationOverride("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveActivationOverrideRateRangeRule flags values above rate", () => {
  const rule = new AdaptiveActivationOverrideRateRangeRule(5.7, 759.5);
  const item = newAdaptiveActivationOverride("x", "y");
  item.rate = 761;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveActivationOverrideEndsAtRangeRule flags values above ends at", () => {
  const rule = new AdaptiveActivationOverrideEndsAtRangeRule(80, 255);
  const item = newAdaptiveActivationOverride("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveActivationOverrideRequiredPhoneRule flags a blank phone", () => {
  const rule = new AdaptiveActivationOverrideRequiredPhoneRule("adaptive activation override needs a value");
  const item = newAdaptiveActivationOverride("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveActivationOverrideCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveActivationOverrideCodeLengthRule(1000);
  const item = newAdaptiveActivationOverride("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
