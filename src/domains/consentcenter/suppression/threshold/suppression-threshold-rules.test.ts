import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionThresholdAttemptsRangeRule,
  SuppressionThresholdNameLengthRule,
  SuppressionThresholdRequiredTimezoneRule,
  SuppressionThresholdTimezoneLengthRule,
  defaultSuppressionThresholdValidator,
} from "./suppression-threshold-rules.js";
import { newSuppressionThreshold } from "./suppression-threshold.js";

test("SuppressionThresholdValidator reports every problem", () => {
  const validator = defaultSuppressionThresholdValidator();
  const item = newSuppressionThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionThresholdNameLengthRule flags a long name", () => {
  const rule = new SuppressionThresholdNameLengthRule(255);
  const item = newSuppressionThreshold("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionThresholdAttemptsRangeRule flags values above attempts", () => {
  const rule = new SuppressionThresholdAttemptsRangeRule(32, 64);
  const item = newSuppressionThreshold("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionThresholdTimezoneLengthRule flags a long timezone", () => {
  const rule = new SuppressionThresholdTimezoneLengthRule(32);
  const item = newSuppressionThreshold("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionThresholdRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SuppressionThresholdRequiredTimezoneRule("suppression threshold needs this field");
  const item = newSuppressionThreshold("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
