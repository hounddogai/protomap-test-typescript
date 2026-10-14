import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWindowCheckpointCodeLengthRule,
  BatchedWindowCheckpointRequiredTitleRule,
  BatchedWindowCheckpointTitleLengthRule,
  defaultBatchedWindowCheckpointValidator,
} from "./batched-window-checkpoint-rules.js";
import { newBatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

test("BatchedWindowCheckpointValidator reports every problem", () => {
  const validator = defaultBatchedWindowCheckpointValidator();
  const item = newBatchedWindowCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWindowCheckpointCodeLengthRule flags a long code", () => {
  const rule = new BatchedWindowCheckpointCodeLengthRule(1000);
  const item = newBatchedWindowCheckpoint("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWindowCheckpointTitleLengthRule flags a long title", () => {
  const rule = new BatchedWindowCheckpointTitleLengthRule(64);
  const item = newBatchedWindowCheckpoint("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWindowCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedWindowCheckpointRequiredTitleRule("batched window checkpoint needs this field");
  const item = newBatchedWindowCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
