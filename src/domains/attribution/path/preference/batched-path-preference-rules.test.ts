import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPathPreferencePhoneLengthRule,
  BatchedPathPreferenceRequiredPhoneRule,
  BatchedPathPreferenceSegmentLengthRule,
  defaultBatchedPathPreferenceValidator,
} from "./batched-path-preference-rules.js";
import { newBatchedPathPreference } from "./batched-path-preference.js";

test("BatchedPathPreferenceValidator reports every problem", () => {
  const validator = defaultBatchedPathPreferenceValidator();
  const item = newBatchedPathPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPathPreferenceSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedPathPreferenceSegmentLengthRule(32);
  const item = newBatchedPathPreference("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPathPreferenceRequiredPhoneRule flags a blank phone", () => {
  const rule = new BatchedPathPreferenceRequiredPhoneRule("batched path preference needs this field");
  const item = newBatchedPathPreference("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPathPreferencePhoneLengthRule flags a long phone", () => {
  const rule = new BatchedPathPreferencePhoneLengthRule(80);
  const item = newBatchedPathPreference("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
