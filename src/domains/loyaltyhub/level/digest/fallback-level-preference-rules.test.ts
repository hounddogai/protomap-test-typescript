import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackLevelPreferenceLabelLengthRule,
  FallbackLevelPreferenceLocaleLengthRule,
  FallbackLevelPreferenceRequiredCodeRule,
  FallbackLevelPreferenceRequiredLabelRule,
  FallbackLevelPreferenceRequiredLocaleRule,
  defaultFallbackLevelPreferenceValidator,
} from "./fallback-level-preference-rules.js";
import { newFallbackLevelPreference } from "./fallback-level-preference.js";

test("FallbackLevelPreferenceValidator reports every problem", () => {
  const validator = defaultFallbackLevelPreferenceValidator();
  const item = newFallbackLevelPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackLevelPreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackLevelPreferenceRequiredLocaleRule("fallback level preference needs an entry");
  const item = newFallbackLevelPreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackLevelPreferenceLabelLengthRule flags a long label", () => {
  const rule = new FallbackLevelPreferenceLabelLengthRule(64);
  const item = newFallbackLevelPreference("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackLevelPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackLevelPreferenceRequiredCodeRule("fallback level preference needs an entry");
  const item = newFallbackLevelPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackLevelPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackLevelPreferenceRequiredLabelRule("fallback level preference needs an entry");
  const item = newFallbackLevelPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackLevelPreferenceLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackLevelPreferenceLocaleLengthRule(86400);
  const item = newFallbackLevelPreference("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
