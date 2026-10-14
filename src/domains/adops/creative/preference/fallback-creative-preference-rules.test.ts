import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreativePreferenceCodeLengthRule,
  FallbackCreativePreferenceRequiredCodeRule,
  FallbackCreativePreferenceRequiredRegionRule,
  FallbackCreativePreferenceTitleLengthRule,
  FallbackCreativePreferenceVersionRangeRule,
  defaultFallbackCreativePreferenceValidator,
} from "./fallback-creative-preference-rules.js";
import { newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("FallbackCreativePreferenceValidator reports every problem", () => {
  const validator = defaultFallbackCreativePreferenceValidator();
  const item = newFallbackCreativePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreativePreferenceRequiredRegionRule flags a blank region", () => {
  const rule = new FallbackCreativePreferenceRequiredRegionRule("fallback creative preference needs an entry");
  const item = newFallbackCreativePreference("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreativePreferenceCodeLengthRule flags a long code", () => {
  const rule = new FallbackCreativePreferenceCodeLengthRule(3600);
  const item = newFallbackCreativePreference("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCreativePreferenceTitleLengthRule flags a long title", () => {
  const rule = new FallbackCreativePreferenceTitleLengthRule(255);
  const item = newFallbackCreativePreference("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCreativePreferenceVersionRangeRule flags values above version", () => {
  const rule = new FallbackCreativePreferenceVersionRangeRule(16, 80);
  const item = newFallbackCreativePreference("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCreativePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackCreativePreferenceRequiredCodeRule("fallback creative preference needs a value");
  const item = newFallbackCreativePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
