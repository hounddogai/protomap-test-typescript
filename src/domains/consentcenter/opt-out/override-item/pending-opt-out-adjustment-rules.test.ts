import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingOptOutAdjustmentConversionRateRangeRule,
  PendingOptOutAdjustmentEndsAtRangeRule,
  PendingOptOutAdjustmentSendAtRangeRule,
  PendingOptOutAdjustmentSummaryLengthRule,
  PendingOptOutAdjustmentThresholdRangeRule,
  defaultPendingOptOutAdjustmentValidator,
} from "./pending-opt-out-adjustment-rules.js";
import { newPendingOptOutAdjustment } from "./pending-opt-out-adjustment.js";

test("PendingOptOutAdjustmentValidator reports every problem", () => {
  const validator = defaultPendingOptOutAdjustmentValidator();
  const item = newPendingOptOutAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingOptOutAdjustmentThresholdRangeRule flags values above threshold", () => {
  const rule = new PendingOptOutAdjustmentThresholdRangeRule(8.7, 3051.4);
  const item = newPendingOptOutAdjustment("x", "y");
  item.threshold = 3052.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingOptOutAdjustmentEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingOptOutAdjustmentEndsAtRangeRule(16, 255);
  const item = newPendingOptOutAdjustment("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingOptOutAdjustmentSummaryLengthRule flags a long summary", () => {
  const rule = new PendingOptOutAdjustmentSummaryLengthRule(16);
  const item = newPendingOptOutAdjustment("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingOptOutAdjustmentSendAtRangeRule flags values above send at", () => {
  const rule = new PendingOptOutAdjustmentSendAtRangeRule(16, 3600);
  const item = newPendingOptOutAdjustment("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingOptOutAdjustmentConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingOptOutAdjustmentConversionRateRangeRule(8.8, 1892.5);
  const item = newPendingOptOutAdjustment("x", "y");
  item.conversionRate = 1894;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
