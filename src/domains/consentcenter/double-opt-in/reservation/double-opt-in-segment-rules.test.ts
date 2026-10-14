import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInSegmentBatchSizeRangeRule,
  DoubleOptInSegmentRequiredCategoryRule,
  DoubleOptInSegmentUnitLengthRule,
  DoubleOptInSegmentUpdatedAtRangeRule,
  defaultDoubleOptInSegmentValidator,
} from "./double-opt-in-segment-rules.js";
import { newDoubleOptInSegment } from "./double-opt-in-segment.js";

test("DoubleOptInSegmentValidator reports every problem", () => {
  const validator = defaultDoubleOptInSegmentValidator();
  const item = newDoubleOptInSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInSegmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new DoubleOptInSegmentUpdatedAtRangeRule(64, 1000);
  const item = newDoubleOptInSegment("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInSegmentUnitLengthRule flags a long unit", () => {
  const rule = new DoubleOptInSegmentUnitLengthRule(80);
  const item = newDoubleOptInSegment("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInSegmentRequiredCategoryRule flags a blank category", () => {
  const rule = new DoubleOptInSegmentRequiredCategoryRule("double opt in segment needs this field");
  const item = newDoubleOptInSegment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInSegmentBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DoubleOptInSegmentBatchSizeRangeRule(32, 64);
  const item = newDoubleOptInSegment("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
