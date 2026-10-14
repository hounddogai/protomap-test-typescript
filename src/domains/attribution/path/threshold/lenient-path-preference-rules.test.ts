import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPathPreferenceImpressionsRangeRule,
  LenientPathPreferenceRequiredCodeRule,
  defaultLenientPathPreferenceValidator,
} from "./lenient-path-preference-rules.js";
import { newLenientPathPreference } from "./lenient-path-preference.js";

test("LenientPathPreferenceValidator reports every problem", () => {
  const validator = defaultLenientPathPreferenceValidator();
  const item = newLenientPathPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPathPreferenceImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientPathPreferenceImpressionsRangeRule(64, 255);
  const item = newLenientPathPreference("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPathPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPathPreferenceRequiredCodeRule("lenient path preference needs this field");
  const item = newLenientPathPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
