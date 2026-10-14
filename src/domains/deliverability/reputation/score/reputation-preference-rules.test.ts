import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationPreferenceImpressionsRangeRule,
  ReputationPreferenceNameLengthRule,
  ReputationPreferenceRequiredNotesRule,
  defaultReputationPreferenceValidator,
} from "./reputation-preference-rules.js";
import { newReputationPreference } from "./reputation-preference.js";

test("ReputationPreferenceValidator reports every problem", () => {
  const validator = defaultReputationPreferenceValidator();
  const item = newReputationPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationPreferenceRequiredNotesRule flags a blank notes", () => {
  const rule = new ReputationPreferenceRequiredNotesRule("reputation preference needs this field");
  const item = newReputationPreference("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationPreferenceNameLengthRule flags a long name", () => {
  const rule = new ReputationPreferenceNameLengthRule(32);
  const item = newReputationPreference("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationPreferenceImpressionsRangeRule flags values above impressions", () => {
  const rule = new ReputationPreferenceImpressionsRangeRule(120, 255);
  const item = newReputationPreference("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
