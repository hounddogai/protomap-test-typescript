import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackQueueAdjustmentCurrencyLengthRule,
  FallbackQueueAdjustmentFrequencyCapRangeRule,
  FallbackQueueAdjustmentLocaleLengthRule,
  FallbackQueueAdjustmentRequiredCurrencyRule,
  defaultFallbackQueueAdjustmentValidator,
} from "./fallback-queue-adjustment-rules.js";
import { newFallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

test("FallbackQueueAdjustmentValidator reports every problem", () => {
  const validator = defaultFallbackQueueAdjustmentValidator();
  const item = newFallbackQueueAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackQueueAdjustmentCurrencyLengthRule flags a long currency", () => {
  const rule = new FallbackQueueAdjustmentCurrencyLengthRule(255);
  const item = newFallbackQueueAdjustment("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackQueueAdjustmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new FallbackQueueAdjustmentFrequencyCapRangeRule(120, 255);
  const item = newFallbackQueueAdjustment("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackQueueAdjustmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackQueueAdjustmentRequiredCurrencyRule("fallback queue adjustment needs this field");
  const item = newFallbackQueueAdjustment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackQueueAdjustmentLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackQueueAdjustmentLocaleLengthRule(3600);
  const item = newFallbackQueueAdjustment("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
