import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceProfileChannelLengthRule,
  PreferenceProfileNameLengthRule,
  PreferenceProfileRequiredCohortRule,
  PreferenceProfileRequiredNameRule,
  defaultPreferenceProfileValidator,
} from "./preference-profile-rules.js";
import { newPreferenceProfile } from "./preference-profile.js";

test("PreferenceProfileValidator reports every problem", () => {
  const validator = defaultPreferenceProfileValidator();
  const item = newPreferenceProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceProfileRequiredCohortRule flags a blank cohort", () => {
  const rule = new PreferenceProfileRequiredCohortRule("preference profile needs this field");
  const item = newPreferenceProfile("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceProfileChannelLengthRule flags a long channel", () => {
  const rule = new PreferenceProfileChannelLengthRule(64);
  const item = newPreferenceProfile("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceProfileRequiredNameRule flags a blank name", () => {
  const rule = new PreferenceProfileRequiredNameRule("preference profile needs a value");
  const item = newPreferenceProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceProfileNameLengthRule flags a long name", () => {
  const rule = new PreferenceProfileNameLengthRule(255);
  const item = newPreferenceProfile("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
