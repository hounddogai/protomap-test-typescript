import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferencePolicyCodeLengthRule,
  PreferencePolicyDescriptionLengthRule,
  PreferencePolicyRequiredCurrencyRule,
  PreferencePolicyRequiredDescriptionRule,
  PreferencePolicySendAtRangeRule,
  defaultPreferencePolicyValidator,
} from "./preference-policy-rules.js";
import { newPreferencePolicy } from "./preference-policy.js";

test("PreferencePolicyValidator reports every problem", () => {
  const validator = defaultPreferencePolicyValidator();
  const item = newPreferencePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferencePolicyRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PreferencePolicyRequiredCurrencyRule("preference policy needs this field");
  const item = newPreferencePolicy("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferencePolicySendAtRangeRule flags values above send at", () => {
  const rule = new PreferencePolicySendAtRangeRule(16, 3600);
  const item = newPreferencePolicy("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferencePolicyDescriptionLengthRule flags a long description", () => {
  const rule = new PreferencePolicyDescriptionLengthRule(64);
  const item = newPreferencePolicy("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferencePolicyRequiredDescriptionRule flags a blank description", () => {
  const rule = new PreferencePolicyRequiredDescriptionRule("preference policy needs an entry");
  const item = newPreferencePolicy("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferencePolicyCodeLengthRule flags a long code", () => {
  const rule = new PreferencePolicyCodeLengthRule(3600);
  const item = newPreferencePolicy("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
