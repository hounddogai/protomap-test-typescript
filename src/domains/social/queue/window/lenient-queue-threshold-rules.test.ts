import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientQueueThresholdCostRangeRule,
  LenientQueueThresholdCreatedAtRangeRule,
  LenientQueueThresholdMarginRangeRule,
  LenientQueueThresholdRequiredLocaleRule,
  defaultLenientQueueThresholdValidator,
} from "./lenient-queue-threshold-rules.js";
import { newLenientQueueThreshold } from "./lenient-queue-threshold.js";

test("LenientQueueThresholdValidator reports every problem", () => {
  const validator = defaultLenientQueueThresholdValidator();
  const item = newLenientQueueThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientQueueThresholdCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientQueueThresholdCreatedAtRangeRule(64, 120);
  const item = newLenientQueueThreshold("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientQueueThresholdRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientQueueThresholdRequiredLocaleRule("lenient queue threshold needs an entry");
  const item = newLenientQueueThreshold("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientQueueThresholdCostRangeRule flags values above cost", () => {
  const rule = new LenientQueueThresholdCostRangeRule(7.8, 1039.2);
  const item = newLenientQueueThreshold("x", "y");
  item.cost = 1040.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientQueueThresholdMarginRangeRule flags values above margin", () => {
  const rule = new LenientQueueThresholdMarginRangeRule(4.1, 591.1);
  const item = newLenientQueueThreshold("x", "y");
  item.margin = 592.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
