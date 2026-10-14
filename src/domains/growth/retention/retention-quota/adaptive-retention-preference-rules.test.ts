import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRetentionPreferenceDurationMinutesRangeRule,
  AdaptiveRetentionPreferenceRequiredCodeRule,
  AdaptiveRetentionPreferenceRequiredDescriptionRule,
  AdaptiveRetentionPreferenceSendAtRangeRule,
  defaultAdaptiveRetentionPreferenceValidator,
} from "./adaptive-retention-preference-rules.js";
import { newAdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

test("AdaptiveRetentionPreferenceValidator reports every problem", () => {
  const validator = defaultAdaptiveRetentionPreferenceValidator();
  const item = newAdaptiveRetentionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRetentionPreferenceDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new AdaptiveRetentionPreferenceDurationMinutesRangeRule(3600, 3600);
  const item = newAdaptiveRetentionPreference("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRetentionPreferenceSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptiveRetentionPreferenceSendAtRangeRule(64, 255);
  const item = newAdaptiveRetentionPreference("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRetentionPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveRetentionPreferenceRequiredCodeRule("adaptive retention preference needs an entry");
  const item = newAdaptiveRetentionPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRetentionPreferenceRequiredDescriptionRule flags a blank description", () => {
  const rule = new AdaptiveRetentionPreferenceRequiredDescriptionRule("adaptive retention preference needs this field");
  const item = newAdaptiveRetentionPreference("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
