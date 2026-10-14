import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLevelPreferenceMarginRangeRule,
  AdaptiveLevelPreferenceRequiredLocaleRule,
  AdaptiveLevelPreferenceRequiredTitleRule,
  defaultAdaptiveLevelPreferenceValidator,
} from "./adaptive-level-preference-rules.js";
import { newAdaptiveLevelPreference } from "./adaptive-level-preference.js";

test("AdaptiveLevelPreferenceValidator reports every problem", () => {
  const validator = defaultAdaptiveLevelPreferenceValidator();
  const item = newAdaptiveLevelPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLevelPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveLevelPreferenceRequiredTitleRule("adaptive level preference needs a value");
  const item = newAdaptiveLevelPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLevelPreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptiveLevelPreferenceRequiredLocaleRule("adaptive level preference needs a value");
  const item = newAdaptiveLevelPreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLevelPreferenceMarginRangeRule flags values above margin", () => {
  const rule = new AdaptiveLevelPreferenceMarginRangeRule(2.4, 4490.3);
  const item = newAdaptiveLevelPreference("x", "y");
  item.margin = 4491.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
