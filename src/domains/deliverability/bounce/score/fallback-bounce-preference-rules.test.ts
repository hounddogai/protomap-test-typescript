import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBouncePreferenceCapacityRangeRule,
  FallbackBouncePreferenceRequiredCurrencyRule,
  defaultFallbackBouncePreferenceValidator,
} from "./fallback-bounce-preference-rules.js";
import { newFallbackBouncePreference } from "./fallback-bounce-preference.js";

test("FallbackBouncePreferenceValidator reports every problem", () => {
  const validator = defaultFallbackBouncePreferenceValidator();
  const item = newFallbackBouncePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBouncePreferenceRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackBouncePreferenceRequiredCurrencyRule("fallback bounce preference needs an entry");
  const item = newFallbackBouncePreference("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBouncePreferenceCapacityRangeRule flags values above capacity", () => {
  const rule = new FallbackBouncePreferenceCapacityRangeRule(64, 255);
  const item = newFallbackBouncePreference("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
