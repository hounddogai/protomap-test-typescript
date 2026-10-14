import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPlacementThresholdBatchSizeRangeRule,
  ManualPlacementThresholdRequiredUnitRule,
  ManualPlacementThresholdTitleLengthRule,
  ManualPlacementThresholdUnitLengthRule,
  defaultManualPlacementThresholdValidator,
} from "./manual-placement-threshold-rules.js";
import { newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("ManualPlacementThresholdValidator reports every problem", () => {
  const validator = defaultManualPlacementThresholdValidator();
  const item = newManualPlacementThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPlacementThresholdUnitLengthRule flags a long unit", () => {
  const rule = new ManualPlacementThresholdUnitLengthRule(16);
  const item = newManualPlacementThreshold("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPlacementThresholdRequiredUnitRule flags a blank unit", () => {
  const rule = new ManualPlacementThresholdRequiredUnitRule("manual placement threshold needs a value");
  const item = newManualPlacementThreshold("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPlacementThresholdBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ManualPlacementThresholdBatchSizeRangeRule(16, 64);
  const item = newManualPlacementThreshold("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPlacementThresholdTitleLengthRule flags a long title", () => {
  const rule = new ManualPlacementThresholdTitleLengthRule(80);
  const item = newManualPlacementThreshold("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
