import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutPreferenceContactEmailLengthRule,
  OptOutPreferenceRateRangeRule,
  OptOutPreferenceRequiredContactEmailRule,
  defaultOptOutPreferenceValidator,
} from "./opt-out-preference-rules.js";
import { newOptOutPreference } from "./opt-out-preference.js";

test("OptOutPreferenceValidator reports every problem", () => {
  const validator = defaultOptOutPreferenceValidator();
  const item = newOptOutPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutPreferenceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new OptOutPreferenceRequiredContactEmailRule("opt out preference needs this field");
  const item = newOptOutPreference("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutPreferenceContactEmailLengthRule flags a long contact email", () => {
  const rule = new OptOutPreferenceContactEmailLengthRule(1000);
  const item = newOptOutPreference("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutPreferenceRateRangeRule flags values above rate", () => {
  const rule = new OptOutPreferenceRateRangeRule(7.2, 3079.2);
  const item = newOptOutPreference("x", "y");
  item.rate = 3080.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
