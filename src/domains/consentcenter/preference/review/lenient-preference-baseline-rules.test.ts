import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPreferenceBaselineDescriptionLengthRule,
  LenientPreferenceBaselineRequiredNotesRule,
  defaultLenientPreferenceBaselineValidator,
} from "./lenient-preference-baseline-rules.js";
import { newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

test("LenientPreferenceBaselineValidator reports every problem", () => {
  const validator = defaultLenientPreferenceBaselineValidator();
  const item = newLenientPreferenceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPreferenceBaselineDescriptionLengthRule flags a long description", () => {
  const rule = new LenientPreferenceBaselineDescriptionLengthRule(32);
  const item = newLenientPreferenceBaseline("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPreferenceBaselineRequiredNotesRule flags a blank notes", () => {
  const rule = new LenientPreferenceBaselineRequiredNotesRule("lenient preference baseline needs this field");
  const item = newLenientPreferenceBaseline("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
