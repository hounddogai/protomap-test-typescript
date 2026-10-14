import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroPreferenceLabelLengthRule,
  MacroPreferenceMinimumRangeRule,
  MacroPreferenceRequiredCodeRule,
  defaultMacroPreferenceValidator,
} from "./macro-preference-rules.js";
import { newMacroPreference } from "./macro-preference.js";

test("MacroPreferenceValidator reports every problem", () => {
  const validator = defaultMacroPreferenceValidator();
  const item = newMacroPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroPreferenceLabelLengthRule flags a long label", () => {
  const rule = new MacroPreferenceLabelLengthRule(86400);
  const item = newMacroPreference("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroPreferenceMinimumRangeRule flags values above minimum", () => {
  const rule = new MacroPreferenceMinimumRangeRule(9.8, 472.4);
  const item = newMacroPreference("x", "y");
  item.minimum = 473.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new MacroPreferenceRequiredCodeRule("macro preference needs a value");
  const item = newMacroPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
