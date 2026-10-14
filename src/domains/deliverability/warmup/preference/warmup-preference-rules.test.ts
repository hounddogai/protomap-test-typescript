import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupPreferenceDescriptionLengthRule,
  WarmupPreferenceRequiredDescriptionRule,
  defaultWarmupPreferenceValidator,
} from "./warmup-preference-rules.js";
import { newWarmupPreference } from "./warmup-preference.js";

test("WarmupPreferenceValidator reports every problem", () => {
  const validator = defaultWarmupPreferenceValidator();
  const item = newWarmupPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupPreferenceRequiredDescriptionRule flags a blank description", () => {
  const rule = new WarmupPreferenceRequiredDescriptionRule("warmup preference needs this field");
  const item = newWarmupPreference("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupPreferenceDescriptionLengthRule flags a long description", () => {
  const rule = new WarmupPreferenceDescriptionLengthRule(64);
  const item = newWarmupPreference("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
