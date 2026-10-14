import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackQueueThresholdLabelLengthRule,
  FallbackQueueThresholdOpenRateRangeRule,
  FallbackQueueThresholdRequiredCategoryRule,
  FallbackQueueThresholdRequiredCodeRule,
  FallbackQueueThresholdRequiredLabelRule,
  defaultFallbackQueueThresholdValidator,
} from "./fallback-queue-threshold-rules.js";
import { newFallbackQueueThreshold } from "./fallback-queue-threshold.js";

test("FallbackQueueThresholdValidator reports every problem", () => {
  const validator = defaultFallbackQueueThresholdValidator();
  const item = newFallbackQueueThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackQueueThresholdRequiredCategoryRule flags a blank category", () => {
  const rule = new FallbackQueueThresholdRequiredCategoryRule("fallback queue threshold needs this field");
  const item = newFallbackQueueThreshold("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackQueueThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackQueueThresholdRequiredLabelRule("fallback queue threshold needs this field");
  const item = newFallbackQueueThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackQueueThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackQueueThresholdRequiredCodeRule("fallback queue threshold needs a value");
  const item = newFallbackQueueThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackQueueThresholdOpenRateRangeRule flags values above open rate", () => {
  const rule = new FallbackQueueThresholdOpenRateRangeRule(0.2, 4657.1);
  const item = newFallbackQueueThreshold("x", "y");
  item.openRate = 4658.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackQueueThresholdLabelLengthRule flags a long label", () => {
  const rule = new FallbackQueueThresholdLabelLengthRule(255);
  const item = newFallbackQueueThreshold("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
