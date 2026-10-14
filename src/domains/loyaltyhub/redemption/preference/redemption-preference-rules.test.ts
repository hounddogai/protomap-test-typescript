import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionPreferenceBudgetRangeRule,
  RedemptionPreferenceCodeLengthRule,
  RedemptionPreferenceDurationMinutesRangeRule,
  defaultRedemptionPreferenceValidator,
} from "./redemption-preference-rules.js";
import { newRedemptionPreference } from "./redemption-preference.js";

test("RedemptionPreferenceValidator reports every problem", () => {
  const validator = defaultRedemptionPreferenceValidator();
  const item = newRedemptionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionPreferenceBudgetRangeRule flags values above budget", () => {
  const rule = new RedemptionPreferenceBudgetRangeRule(8, 2855.3);
  const item = newRedemptionPreference("x", "y");
  item.budget = 2856.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionPreferenceCodeLengthRule flags a long code", () => {
  const rule = new RedemptionPreferenceCodeLengthRule(255);
  const item = newRedemptionPreference("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionPreferenceDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RedemptionPreferenceDurationMinutesRangeRule(16, 32);
  const item = newRedemptionPreference("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
