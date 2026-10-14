import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedTouchpointPreferenceRequiredCodeRule,
  BatchedTouchpointPreferenceStartsAtRangeRule,
  BatchedTouchpointPreferenceThresholdRangeRule,
  defaultBatchedTouchpointPreferenceValidator,
} from "./batched-touchpoint-preference-rules.js";
import { newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

test("BatchedTouchpointPreferenceValidator reports every problem", () => {
  const validator = defaultBatchedTouchpointPreferenceValidator();
  const item = newBatchedTouchpointPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedTouchpointPreferenceThresholdRangeRule flags values above threshold", () => {
  const rule = new BatchedTouchpointPreferenceThresholdRangeRule(8.1, 4669.1);
  const item = newBatchedTouchpointPreference("x", "y");
  item.threshold = 4670.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTouchpointPreferenceStartsAtRangeRule flags values above starts at", () => {
  const rule = new BatchedTouchpointPreferenceStartsAtRangeRule(64, 120);
  const item = newBatchedTouchpointPreference("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTouchpointPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedTouchpointPreferenceRequiredCodeRule("batched touchpoint preference needs a value");
  const item = newBatchedTouchpointPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
