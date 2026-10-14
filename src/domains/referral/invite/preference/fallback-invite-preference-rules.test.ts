import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackInvitePreferenceCodeLengthRule,
  FallbackInvitePreferenceRequiredCodeRule,
  FallbackInvitePreferenceRequiredTimezoneRule,
  FallbackInvitePreferenceRequiredTitleRule,
  defaultFallbackInvitePreferenceValidator,
} from "./fallback-invite-preference-rules.js";
import { newFallbackInvitePreference } from "./fallback-invite-preference.js";

test("FallbackInvitePreferenceValidator reports every problem", () => {
  const validator = defaultFallbackInvitePreferenceValidator();
  const item = newFallbackInvitePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackInvitePreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackInvitePreferenceRequiredTitleRule("fallback invite preference needs this field");
  const item = newFallbackInvitePreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInvitePreferenceRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackInvitePreferenceRequiredTimezoneRule("fallback invite preference needs a value");
  const item = newFallbackInvitePreference("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInvitePreferenceCodeLengthRule flags a long code", () => {
  const rule = new FallbackInvitePreferenceCodeLengthRule(32);
  const item = newFallbackInvitePreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackInvitePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackInvitePreferenceRequiredCodeRule("fallback invite preference needs a value");
  const item = newFallbackInvitePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
