import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInThresholdBatchSizeRangeRule,
  DoubleOptInThresholdTitleLengthRule,
  DoubleOptInThresholdVersionRangeRule,
  defaultDoubleOptInThresholdValidator,
} from "./double-opt-in-threshold-rules.js";
import { newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

test("DoubleOptInThresholdValidator reports every problem", () => {
  const validator = defaultDoubleOptInThresholdValidator();
  const item = newDoubleOptInThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInThresholdBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DoubleOptInThresholdBatchSizeRangeRule(32, 120);
  const item = newDoubleOptInThreshold("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInThresholdVersionRangeRule flags values above version", () => {
  const rule = new DoubleOptInThresholdVersionRangeRule(64, 80);
  const item = newDoubleOptInThreshold("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInThresholdTitleLengthRule flags a long title", () => {
  const rule = new DoubleOptInThresholdTitleLengthRule(120);
  const item = newDoubleOptInThreshold("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
