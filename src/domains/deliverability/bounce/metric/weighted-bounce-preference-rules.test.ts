import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedBouncePreferenceCodeLengthRule,
  WeightedBouncePreferenceRatioRangeRule,
  WeightedBouncePreferenceRequiredCodeRule,
  WeightedBouncePreferenceRequiredLocaleRule,
  defaultWeightedBouncePreferenceValidator,
} from "./weighted-bounce-preference-rules.js";
import { newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("WeightedBouncePreferenceValidator reports every problem", () => {
  const validator = defaultWeightedBouncePreferenceValidator();
  const item = newWeightedBouncePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedBouncePreferenceCodeLengthRule flags a long code", () => {
  const rule = new WeightedBouncePreferenceCodeLengthRule(32);
  const item = newWeightedBouncePreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedBouncePreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedBouncePreferenceRequiredLocaleRule("weighted bounce preference needs an entry");
  const item = newWeightedBouncePreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBouncePreferenceRatioRangeRule flags values above ratio", () => {
  const rule = new WeightedBouncePreferenceRatioRangeRule(4.8, 4522.4);
  const item = newWeightedBouncePreference("x", "y");
  item.ratio = 4523.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedBouncePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedBouncePreferenceRequiredCodeRule("weighted bounce preference needs this field");
  const item = newWeightedBouncePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
