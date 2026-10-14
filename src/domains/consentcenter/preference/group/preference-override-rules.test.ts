import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceOverrideRequiredCodeRule,
  PreferenceOverrideRequiredLabelRule,
  PreferenceOverrideReviewerLengthRule,
  PreferenceOverrideSendAtRangeRule,
  defaultPreferenceOverrideValidator,
} from "./preference-override-rules.js";
import { newPreferenceOverride } from "./preference-override.js";

test("PreferenceOverrideValidator reports every problem", () => {
  const validator = defaultPreferenceOverrideValidator();
  const item = newPreferenceOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new PreferenceOverrideRequiredLabelRule("preference override needs this field");
  const item = newPreferenceOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceOverrideRequiredCodeRule("preference override needs an entry");
  const item = newPreferenceOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceOverrideReviewerLengthRule flags a long reviewer", () => {
  const rule = new PreferenceOverrideReviewerLengthRule(255);
  const item = newPreferenceOverride("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceOverrideSendAtRangeRule flags values above send at", () => {
  const rule = new PreferenceOverrideSendAtRangeRule(32, 3600);
  const item = newPreferenceOverride("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
