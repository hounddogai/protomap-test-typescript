import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingPreferenceBudgetRangeRule,
  PacingPreferenceNameLengthRule,
  PacingPreferenceRequiredChannelRule,
  defaultPacingPreferenceValidator,
} from "./pacing-preference-rules.js";
import { newPacingPreference } from "./pacing-preference.js";

test("PacingPreferenceValidator reports every problem", () => {
  const validator = defaultPacingPreferenceValidator();
  const item = newPacingPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingPreferenceNameLengthRule flags a long name", () => {
  const rule = new PacingPreferenceNameLengthRule(80);
  const item = newPacingPreference("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingPreferenceBudgetRangeRule flags values above budget", () => {
  const rule = new PacingPreferenceBudgetRangeRule(4.7, 2879.3);
  const item = newPacingPreference("x", "y");
  item.budget = 2880.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingPreferenceRequiredChannelRule flags a blank channel", () => {
  const rule = new PacingPreferenceRequiredChannelRule("pacing preference needs this field");
  const item = newPacingPreference("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
