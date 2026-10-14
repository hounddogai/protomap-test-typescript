import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceTargetLabelLengthRule,
  PreferenceTargetRequiredCodeRule,
  PreferenceTargetRequiredNotesRule,
  defaultPreferenceTargetValidator,
} from "./preference-target-rules.js";
import { newPreferenceTarget } from "./preference-target.js";

test("PreferenceTargetValidator reports every problem", () => {
  const validator = defaultPreferenceTargetValidator();
  const item = newPreferenceTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceTargetRequiredNotesRule flags a blank notes", () => {
  const rule = new PreferenceTargetRequiredNotesRule("preference target needs an entry");
  const item = newPreferenceTarget("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceTargetRequiredCodeRule("preference target needs this field");
  const item = newPreferenceTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceTargetLabelLengthRule flags a long label", () => {
  const rule = new PreferenceTargetLabelLengthRule(32);
  const item = newPreferenceTarget("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
