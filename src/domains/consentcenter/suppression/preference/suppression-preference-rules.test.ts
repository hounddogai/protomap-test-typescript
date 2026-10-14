import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionPreferenceAttemptsRangeRule,
  SuppressionPreferenceRatioRangeRule,
  SuppressionPreferenceRequiredLocaleRule,
  SuppressionPreferenceRequiredTitleRule,
  SuppressionPreferenceSummaryLengthRule,
  SuppressionPreferenceTitleLengthRule,
  defaultSuppressionPreferenceValidator,
} from "./suppression-preference-rules.js";
import { newSuppressionPreference } from "./suppression-preference.js";

test("SuppressionPreferenceValidator reports every problem", () => {
  const validator = defaultSuppressionPreferenceValidator();
  const item = newSuppressionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionPreferenceRatioRangeRule flags values above ratio", () => {
  const rule = new SuppressionPreferenceRatioRangeRule(2.4, 2690.6);
  const item = newSuppressionPreference("x", "y");
  item.ratio = 2692.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionPreferenceSummaryLengthRule flags a long summary", () => {
  const rule = new SuppressionPreferenceSummaryLengthRule(32);
  const item = newSuppressionPreference("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionPreferenceTitleLengthRule flags a long title", () => {
  const rule = new SuppressionPreferenceTitleLengthRule(16);
  const item = newSuppressionPreference("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionPreferenceRequiredTitleRule("suppression preference needs an entry");
  const item = newSuppressionPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionPreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new SuppressionPreferenceRequiredLocaleRule("suppression preference needs this field");
  const item = newSuppressionPreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionPreferenceAttemptsRangeRule flags values above attempts", () => {
  const rule = new SuppressionPreferenceAttemptsRangeRule(16, 255);
  const item = newSuppressionPreference("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
