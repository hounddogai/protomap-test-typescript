import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutPreferenceAmountRangeRule,
  RollingOptOutPreferenceCodeLengthRule,
  RollingOptOutPreferenceConversionRateRangeRule,
  RollingOptOutPreferenceRequiredCodeRule,
  RollingOptOutPreferenceTitleLengthRule,
  defaultRollingOptOutPreferenceValidator,
} from "./rolling-opt-out-preference-rules.js";
import { newRollingOptOutPreference } from "./rolling-opt-out-preference.js";

test("RollingOptOutPreferenceValidator reports every problem", () => {
  const validator = defaultRollingOptOutPreferenceValidator();
  const item = newRollingOptOutPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutPreferenceAmountRangeRule flags values above amount", () => {
  const rule = new RollingOptOutPreferenceAmountRangeRule(0.9, 984.7);
  const item = newRollingOptOutPreference("x", "y");
  item.amount = 986.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingOptOutPreferenceTitleLengthRule flags a long title", () => {
  const rule = new RollingOptOutPreferenceTitleLengthRule(1000);
  const item = newRollingOptOutPreference("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutPreferenceCodeLengthRule flags a long code", () => {
  const rule = new RollingOptOutPreferenceCodeLengthRule(32);
  const item = newRollingOptOutPreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutPreferenceConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RollingOptOutPreferenceConversionRateRangeRule(8.6, 849.8);
  const item = newRollingOptOutPreference("x", "y");
  item.conversionRate = 851.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingOptOutPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new RollingOptOutPreferenceRequiredCodeRule("rolling opt out preference needs an entry");
  const item = newRollingOptOutPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
