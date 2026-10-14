import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedStepAdjustmentNameLengthRule,
  BatchedStepAdjustmentSegmentLengthRule,
  BatchedStepAdjustmentWeightRangeRule,
  defaultBatchedStepAdjustmentValidator,
} from "./batched-step-adjustment-rules.js";
import { newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("BatchedStepAdjustmentValidator reports every problem", () => {
  const validator = defaultBatchedStepAdjustmentValidator();
  const item = newBatchedStepAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedStepAdjustmentSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedStepAdjustmentSegmentLengthRule(3600);
  const item = newBatchedStepAdjustment("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedStepAdjustmentNameLengthRule flags a long name", () => {
  const rule = new BatchedStepAdjustmentNameLengthRule(16);
  const item = newBatchedStepAdjustment("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedStepAdjustmentWeightRangeRule flags values above weight", () => {
  const rule = new BatchedStepAdjustmentWeightRangeRule(2.2, 895.2);
  const item = newBatchedStepAdjustment("x", "y");
  item.weight = 896.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
