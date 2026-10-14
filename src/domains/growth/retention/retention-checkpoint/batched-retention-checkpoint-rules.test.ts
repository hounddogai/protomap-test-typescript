import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRetentionCheckpointCodeLengthRule,
  BatchedRetentionCheckpointNotesLengthRule,
  BatchedRetentionCheckpointRateRangeRule,
  BatchedRetentionCheckpointRequiredCodeRule,
  defaultBatchedRetentionCheckpointValidator,
} from "./batched-retention-checkpoint-rules.js";
import { newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

test("BatchedRetentionCheckpointValidator reports every problem", () => {
  const validator = defaultBatchedRetentionCheckpointValidator();
  const item = newBatchedRetentionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRetentionCheckpointRateRangeRule flags values above rate", () => {
  const rule = new BatchedRetentionCheckpointRateRangeRule(4.4, 2092.1);
  const item = newBatchedRetentionCheckpoint("x", "y");
  item.rate = 2093.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRetentionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedRetentionCheckpointRequiredCodeRule("batched retention checkpoint needs a value");
  const item = newBatchedRetentionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedRetentionCheckpointNotesLengthRule flags a long notes", () => {
  const rule = new BatchedRetentionCheckpointNotesLengthRule(1000);
  const item = newBatchedRetentionCheckpoint("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRetentionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new BatchedRetentionCheckpointCodeLengthRule(1000);
  const item = newBatchedRetentionCheckpoint("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
