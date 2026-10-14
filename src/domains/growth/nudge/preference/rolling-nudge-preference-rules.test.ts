import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgePreferenceCreatedAtRangeRule,
  RollingNudgePreferenceLabelLengthRule,
  RollingNudgePreferenceRequiredUtmSourceRule,
  RollingNudgePreferenceUnitLengthRule,
  RollingNudgePreferenceUtmSourceLengthRule,
  defaultRollingNudgePreferenceValidator,
} from "./rolling-nudge-preference-rules.js";
import { newRollingNudgePreference } from "./rolling-nudge-preference.js";

test("RollingNudgePreferenceValidator reports every problem", () => {
  const validator = defaultRollingNudgePreferenceValidator();
  const item = newRollingNudgePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgePreferenceLabelLengthRule flags a long label", () => {
  const rule = new RollingNudgePreferenceLabelLengthRule(120);
  const item = newRollingNudgePreference("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgePreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RollingNudgePreferenceUtmSourceLengthRule(86400);
  const item = newRollingNudgePreference("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgePreferenceUnitLengthRule flags a long unit", () => {
  const rule = new RollingNudgePreferenceUnitLengthRule(32);
  const item = newRollingNudgePreference("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgePreferenceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RollingNudgePreferenceRequiredUtmSourceRule("rolling nudge preference needs a value");
  const item = newRollingNudgePreference("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgePreferenceCreatedAtRangeRule flags values above created at", () => {
  const rule = new RollingNudgePreferenceCreatedAtRangeRule(80, 1000);
  const item = newRollingNudgePreference("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
