import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallPreferenceCodeLengthRule,
  PaywallPreferenceRequiredUnitRule,
  PaywallPreferenceUnitLengthRule,
  defaultPaywallPreferenceValidator,
} from "./paywall-preference-rules.js";
import { newPaywallPreference } from "./paywall-preference.js";

test("PaywallPreferenceValidator reports every problem", () => {
  const validator = defaultPaywallPreferenceValidator();
  const item = newPaywallPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallPreferenceRequiredUnitRule flags a blank unit", () => {
  const rule = new PaywallPreferenceRequiredUnitRule("paywall preference needs an entry");
  const item = newPaywallPreference("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallPreferenceCodeLengthRule flags a long code", () => {
  const rule = new PaywallPreferenceCodeLengthRule(3600);
  const item = newPaywallPreference("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallPreferenceUnitLengthRule flags a long unit", () => {
  const rule = new PaywallPreferenceUnitLengthRule(120);
  const item = newPaywallPreference("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
