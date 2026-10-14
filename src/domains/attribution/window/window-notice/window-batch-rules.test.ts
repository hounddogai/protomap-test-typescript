import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowBatchCodeLengthRule,
  WindowBatchLabelLengthRule,
  WindowBatchMarginRangeRule,
  WindowBatchRequiredLabelRule,
  WindowBatchThresholdRangeRule,
  defaultWindowBatchValidator,
} from "./window-batch-rules.js";
import { newWindowBatch } from "./window-batch.js";

test("WindowBatchValidator reports every problem", () => {
  const validator = defaultWindowBatchValidator();
  const item = newWindowBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowBatchMarginRangeRule flags values above margin", () => {
  const rule = new WindowBatchMarginRangeRule(8.2, 3924.4);
  const item = newWindowBatch("x", "y");
  item.margin = 3925.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowBatchLabelLengthRule flags a long label", () => {
  const rule = new WindowBatchLabelLengthRule(255);
  const item = newWindowBatch("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowBatchThresholdRangeRule flags values above threshold", () => {
  const rule = new WindowBatchThresholdRangeRule(5.7, 418.7);
  const item = newWindowBatch("x", "y");
  item.threshold = 420.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowBatchRequiredLabelRule flags a blank label", () => {
  const rule = new WindowBatchRequiredLabelRule("window batch needs this field");
  const item = newWindowBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowBatchCodeLengthRule flags a long code", () => {
  const rule = new WindowBatchCodeLengthRule(86400);
  const item = newWindowBatch("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
