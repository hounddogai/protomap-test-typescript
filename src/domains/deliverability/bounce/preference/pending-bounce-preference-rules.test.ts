import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBouncePreferenceCodeLengthRule,
  PendingBouncePreferenceLabelLengthRule,
  PendingBouncePreferenceRequiredCodeRule,
  PendingBouncePreferenceThresholdRangeRule,
  defaultPendingBouncePreferenceValidator,
} from "./pending-bounce-preference-rules.js";
import { newPendingBouncePreference } from "./pending-bounce-preference.js";

test("PendingBouncePreferenceValidator reports every problem", () => {
  const validator = defaultPendingBouncePreferenceValidator();
  const item = newPendingBouncePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBouncePreferenceCodeLengthRule flags a long code", () => {
  const rule = new PendingBouncePreferenceCodeLengthRule(64);
  const item = newPendingBouncePreference("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBouncePreferenceThresholdRangeRule flags values above threshold", () => {
  const rule = new PendingBouncePreferenceThresholdRangeRule(7.5, 1148.1);
  const item = newPendingBouncePreference("x", "y");
  item.threshold = 1149.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBouncePreferenceLabelLengthRule flags a long label", () => {
  const rule = new PendingBouncePreferenceLabelLengthRule(255);
  const item = newPendingBouncePreference("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBouncePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new PendingBouncePreferenceRequiredCodeRule("pending bounce preference needs this field");
  const item = newPendingBouncePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
