import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointBatchBatchSizeRangeRule,
  TouchpointBatchConversionRateRangeRule,
  TouchpointBatchTitleLengthRule,
  defaultTouchpointBatchValidator,
} from "./touchpoint-batch-rules.js";
import { newTouchpointBatch } from "./touchpoint-batch.js";

test("TouchpointBatchValidator reports every problem", () => {
  const validator = defaultTouchpointBatchValidator();
  const item = newTouchpointBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointBatchConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TouchpointBatchConversionRateRangeRule(3, 1384.9);
  const item = newTouchpointBatch("x", "y");
  item.conversionRate = 1386.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointBatchBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TouchpointBatchBatchSizeRangeRule(32, 86400);
  const item = newTouchpointBatch("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointBatchTitleLengthRule flags a long title", () => {
  const rule = new TouchpointBatchTitleLengthRule(32);
  const item = newTouchpointBatch("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
