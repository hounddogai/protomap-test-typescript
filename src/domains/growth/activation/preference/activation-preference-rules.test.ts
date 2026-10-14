import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationPreferenceEndsAtRangeRule,
  ActivationPreferenceRequiredTimezoneRule,
  ActivationPreferenceRequiredTitleRule,
  ActivationPreferenceTimezoneLengthRule,
  ActivationPreferenceTitleLengthRule,
  defaultActivationPreferenceValidator,
} from "./activation-preference-rules.js";
import { newActivationPreference } from "./activation-preference.js";

test("ActivationPreferenceValidator reports every problem", () => {
  const validator = defaultActivationPreferenceValidator();
  const item = newActivationPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationPreferenceEndsAtRangeRule flags values above ends at", () => {
  const rule = new ActivationPreferenceEndsAtRangeRule(32, 64);
  const item = newActivationPreference("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new ActivationPreferenceRequiredTitleRule("activation preference needs a value");
  const item = newActivationPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationPreferenceTitleLengthRule flags a long title", () => {
  const rule = new ActivationPreferenceTitleLengthRule(64);
  const item = newActivationPreference("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationPreferenceRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ActivationPreferenceRequiredTimezoneRule("activation preference needs a value");
  const item = newActivationPreference("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationPreferenceTimezoneLengthRule flags a long timezone", () => {
  const rule = new ActivationPreferenceTimezoneLengthRule(120);
  const item = newActivationPreference("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
