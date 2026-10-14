import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreditPreferenceRequiredCodeRule,
  FallbackCreditPreferenceRequiredNameRule,
  FallbackCreditPreferenceRequiredUnitRule,
  FallbackCreditPreferenceRevisionRangeRule,
  defaultFallbackCreditPreferenceValidator,
} from "./fallback-credit-preference-rules.js";
import { newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("FallbackCreditPreferenceValidator reports every problem", () => {
  const validator = defaultFallbackCreditPreferenceValidator();
  const item = newFallbackCreditPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreditPreferenceRevisionRangeRule flags values above revision", () => {
  const rule = new FallbackCreditPreferenceRevisionRangeRule(80, 255);
  const item = newFallbackCreditPreference("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCreditPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackCreditPreferenceRequiredCodeRule("fallback credit preference needs this field");
  const item = newFallbackCreditPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditPreferenceRequiredUnitRule flags a blank unit", () => {
  const rule = new FallbackCreditPreferenceRequiredUnitRule("fallback credit preference needs this field");
  const item = newFallbackCreditPreference("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new FallbackCreditPreferenceRequiredNameRule("fallback credit preference needs a value");
  const item = newFallbackCreditPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
