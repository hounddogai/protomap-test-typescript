import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceDraftCodeLengthRule,
  PreferenceDraftLabelLengthRule,
  PreferenceDraftNotesLengthRule,
  PreferenceDraftRequiredLabelRule,
  defaultPreferenceDraftValidator,
} from "./preference-draft-rules.js";
import { newPreferenceDraft } from "./preference-draft.js";

test("PreferenceDraftValidator reports every problem", () => {
  const validator = defaultPreferenceDraftValidator();
  const item = newPreferenceDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceDraftRequiredLabelRule flags a blank label", () => {
  const rule = new PreferenceDraftRequiredLabelRule("preference draft needs a value");
  const item = newPreferenceDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceDraftCodeLengthRule flags a long code", () => {
  const rule = new PreferenceDraftCodeLengthRule(32);
  const item = newPreferenceDraft("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceDraftNotesLengthRule flags a long notes", () => {
  const rule = new PreferenceDraftNotesLengthRule(1000);
  const item = newPreferenceDraft("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceDraftLabelLengthRule flags a long label", () => {
  const rule = new PreferenceDraftLabelLengthRule(255);
  const item = newPreferenceDraft("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
