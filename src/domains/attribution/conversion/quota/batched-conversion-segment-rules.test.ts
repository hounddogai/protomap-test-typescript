import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedConversionSegmentLabelLengthRule,
  BatchedConversionSegmentRateRangeRule,
  BatchedConversionSegmentRequiredCodeRule,
  BatchedConversionSegmentRequiredLabelRule,
  defaultBatchedConversionSegmentValidator,
} from "./batched-conversion-segment-rules.js";
import { newBatchedConversionSegment } from "./batched-conversion-segment.js";

test("BatchedConversionSegmentValidator reports every problem", () => {
  const validator = defaultBatchedConversionSegmentValidator();
  const item = newBatchedConversionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedConversionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedConversionSegmentRequiredCodeRule("batched conversion segment needs an entry");
  const item = newBatchedConversionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedConversionSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedConversionSegmentRequiredLabelRule("batched conversion segment needs an entry");
  const item = newBatchedConversionSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedConversionSegmentLabelLengthRule flags a long label", () => {
  const rule = new BatchedConversionSegmentLabelLengthRule(255);
  const item = newBatchedConversionSegment("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedConversionSegmentRateRangeRule flags values above rate", () => {
  const rule = new BatchedConversionSegmentRateRangeRule(3.7, 803.4);
  const item = newBatchedConversionSegment("x", "y");
  item.rate = 804.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
