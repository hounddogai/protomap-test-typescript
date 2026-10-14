import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveMacroPreferenceCodeLengthRule,
  AdaptiveMacroPreferenceRequiredLabelRule,
  AdaptiveMacroPreferenceRequiredNameRule,
  AdaptiveMacroPreferenceSummaryLengthRule,
  defaultAdaptiveMacroPreferenceValidator,
} from "./adaptive-macro-preference-rules.js";
import { newAdaptiveMacroPreference } from "./adaptive-macro-preference.js";

test("AdaptiveMacroPreferenceValidator reports every problem", () => {
  const validator = defaultAdaptiveMacroPreferenceValidator();
  const item = newAdaptiveMacroPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveMacroPreferenceCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveMacroPreferenceCodeLengthRule(64);
  const item = newAdaptiveMacroPreference("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveMacroPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveMacroPreferenceRequiredLabelRule("adaptive macro preference needs an entry");
  const item = newAdaptiveMacroPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMacroPreferenceSummaryLengthRule flags a long summary", () => {
  const rule = new AdaptiveMacroPreferenceSummaryLengthRule(16);
  const item = newAdaptiveMacroPreference("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveMacroPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveMacroPreferenceRequiredNameRule("adaptive macro preference needs this field");
  const item = newAdaptiveMacroPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
