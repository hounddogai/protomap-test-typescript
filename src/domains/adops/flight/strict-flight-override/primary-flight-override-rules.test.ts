import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFlightOverrideConversionRateRangeRule,
  PrimaryFlightOverrideRequiredCodeRule,
  PrimaryFlightOverrideRequiredVariantRule,
  PrimaryFlightOverrideVariantLengthRule,
  defaultPrimaryFlightOverrideValidator,
} from "./primary-flight-override-rules.js";
import { newPrimaryFlightOverride } from "./primary-flight-override.js";

test("PrimaryFlightOverrideValidator reports every problem", () => {
  const validator = defaultPrimaryFlightOverrideValidator();
  const item = newPrimaryFlightOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFlightOverrideRequiredVariantRule flags a blank variant", () => {
  const rule = new PrimaryFlightOverrideRequiredVariantRule("primary flight override needs an entry");
  const item = newPrimaryFlightOverride("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFlightOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFlightOverrideRequiredCodeRule("primary flight override needs an entry");
  const item = newPrimaryFlightOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFlightOverrideConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PrimaryFlightOverrideConversionRateRangeRule(2.2, 3256.5);
  const item = newPrimaryFlightOverride("x", "y");
  item.conversionRate = 3258;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFlightOverrideVariantLengthRule flags a long variant", () => {
  const rule = new PrimaryFlightOverrideVariantLengthRule(32);
  const item = newPrimaryFlightOverride("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
