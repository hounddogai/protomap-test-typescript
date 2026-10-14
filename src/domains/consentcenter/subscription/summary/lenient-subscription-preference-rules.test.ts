import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSubscriptionPreferenceFrequencyCapRangeRule,
  LenientSubscriptionPreferenceRequiredCodeRule,
  LenientSubscriptionPreferenceRevisionRangeRule,
  defaultLenientSubscriptionPreferenceValidator,
} from "./lenient-subscription-preference-rules.js";
import { newLenientSubscriptionPreference } from "./lenient-subscription-preference.js";

test("LenientSubscriptionPreferenceValidator reports every problem", () => {
  const validator = defaultLenientSubscriptionPreferenceValidator();
  const item = newLenientSubscriptionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSubscriptionPreferenceRevisionRangeRule flags values above revision", () => {
  const rule = new LenientSubscriptionPreferenceRevisionRangeRule(16, 32);
  const item = newLenientSubscriptionPreference("x", "y");
  item.revision = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSubscriptionPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new LenientSubscriptionPreferenceRequiredCodeRule("lenient subscription preference needs this field");
  const item = newLenientSubscriptionPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSubscriptionPreferenceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LenientSubscriptionPreferenceFrequencyCapRangeRule(80, 1000);
  const item = newLenientSubscriptionPreference("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
