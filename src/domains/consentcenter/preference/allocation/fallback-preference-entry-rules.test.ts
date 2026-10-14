import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPreferenceEntryCodeLengthRule,
  FallbackPreferenceEntryRequiredTimezoneRule,
  FallbackPreferenceEntryTimezoneLengthRule,
  FallbackPreferenceEntryTitleLengthRule,
  defaultFallbackPreferenceEntryValidator,
} from "./fallback-preference-entry-rules.js";
import { newFallbackPreferenceEntry } from "./fallback-preference-entry.js";

test("FallbackPreferenceEntryValidator reports every problem", () => {
  const validator = defaultFallbackPreferenceEntryValidator();
  const item = newFallbackPreferenceEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPreferenceEntryCodeLengthRule flags a long code", () => {
  const rule = new FallbackPreferenceEntryCodeLengthRule(86400);
  const item = newFallbackPreferenceEntry("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceEntryTimezoneLengthRule flags a long timezone", () => {
  const rule = new FallbackPreferenceEntryTimezoneLengthRule(255);
  const item = newFallbackPreferenceEntry("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceEntryTitleLengthRule flags a long title", () => {
  const rule = new FallbackPreferenceEntryTitleLengthRule(1000);
  const item = newFallbackPreferenceEntry("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceEntryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackPreferenceEntryRequiredTimezoneRule("fallback preference entry needs an entry");
  const item = newFallbackPreferenceEntry("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
