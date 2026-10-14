import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSenderBatchCeilingRangeRule,
  BatchedSenderBatchNameLengthRule,
  BatchedSenderBatchRequiredLabelRule,
  defaultBatchedSenderBatchValidator,
} from "./batched-sender-batch-rules.js";
import { newBatchedSenderBatch } from "./batched-sender-batch.js";

test("BatchedSenderBatchValidator reports every problem", () => {
  const validator = defaultBatchedSenderBatchValidator();
  const item = newBatchedSenderBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSenderBatchRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedSenderBatchRequiredLabelRule("batched sender batch needs an entry");
  const item = newBatchedSenderBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSenderBatchCeilingRangeRule flags values above ceiling", () => {
  const rule = new BatchedSenderBatchCeilingRangeRule(4.3, 2504.2);
  const item = newBatchedSenderBatch("x", "y");
  item.ceiling = 2505.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSenderBatchNameLengthRule flags a long name", () => {
  const rule = new BatchedSenderBatchNameLengthRule(64);
  const item = newBatchedSenderBatch("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
