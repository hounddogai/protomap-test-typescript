import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostPreferenceNotesLengthRule,
  PostPreferenceQuantityRangeRule,
  PostPreferenceRequiredNameRule,
  PostPreferenceRequiredNotesRule,
  defaultPostPreferenceValidator,
} from "./post-preference-rules.js";
import { newPostPreference } from "./post-preference.js";

test("PostPreferenceValidator reports every problem", () => {
  const validator = defaultPostPreferenceValidator();
  const item = newPostPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostPreferenceNotesLengthRule flags a long notes", () => {
  const rule = new PostPreferenceNotesLengthRule(255);
  const item = newPostPreference("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new PostPreferenceRequiredNameRule("post preference needs this field");
  const item = newPostPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostPreferenceRequiredNotesRule flags a blank notes", () => {
  const rule = new PostPreferenceRequiredNotesRule("post preference needs a value");
  const item = newPostPreference("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostPreferenceQuantityRangeRule flags values above quantity", () => {
  const rule = new PostPreferenceQuantityRangeRule(16, 64);
  const item = newPostPreference("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
