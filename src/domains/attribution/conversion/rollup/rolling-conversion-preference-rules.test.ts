import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingConversionPreferenceCodeLengthRule,
  RollingConversionPreferenceLabelLengthRule,
  RollingConversionPreferenceRequiredLabelRule,
  RollingConversionPreferenceThresholdRangeRule,
  RollingConversionPreferenceUtmSourceLengthRule,
  defaultRollingConversionPreferenceValidator,
} from "./rolling-conversion-preference-rules.js";
import { newRollingConversionPreference } from "./rolling-conversion-preference.js";

test("RollingConversionPreferenceValidator reports every problem", () => {
  const validator = defaultRollingConversionPreferenceValidator();
  const item = newRollingConversionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingConversionPreferenceLabelLengthRule flags a long label", () => {
  const rule = new RollingConversionPreferenceLabelLengthRule(255);
  const item = newRollingConversionPreference("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingConversionPreferenceCodeLengthRule flags a long code", () => {
  const rule = new RollingConversionPreferenceCodeLengthRule(16);
  const item = newRollingConversionPreference("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingConversionPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new RollingConversionPreferenceRequiredLabelRule("rolling conversion preference needs a value");
  const item = newRollingConversionPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingConversionPreferenceThresholdRangeRule flags values above threshold", () => {
  const rule = new RollingConversionPreferenceThresholdRangeRule(8.1, 438.9);
  const item = newRollingConversionPreference("x", "y");
  item.threshold = 440.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingConversionPreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RollingConversionPreferenceUtmSourceLengthRule(1000);
  const item = newRollingConversionPreference("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
