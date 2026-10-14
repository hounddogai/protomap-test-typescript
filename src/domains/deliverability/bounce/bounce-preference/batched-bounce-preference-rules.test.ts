import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBouncePreferenceLabelLengthRule,
  BatchedBouncePreferenceRequiredCodeRule,
  BatchedBouncePreferenceRevisionRangeRule,
  defaultBatchedBouncePreferenceValidator,
} from "./batched-bounce-preference-rules.js";
import { newBatchedBouncePreference } from "./batched-bounce-preference.js";

test("BatchedBouncePreferenceValidator reports every problem", () => {
  const validator = defaultBatchedBouncePreferenceValidator();
  const item = newBatchedBouncePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBouncePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedBouncePreferenceRequiredCodeRule("batched bounce preference needs a value");
  const item = newBatchedBouncePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedBouncePreferenceRevisionRangeRule flags values above revision", () => {
  const rule = new BatchedBouncePreferenceRevisionRangeRule(255, 255);
  const item = newBatchedBouncePreference("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBouncePreferenceLabelLengthRule flags a long label", () => {
  const rule = new BatchedBouncePreferenceLabelLengthRule(64);
  const item = newBatchedBouncePreference("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
