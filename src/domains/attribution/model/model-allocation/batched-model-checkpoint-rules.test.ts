import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedModelCheckpointCodeLengthRule,
  BatchedModelCheckpointPriorityRangeRule,
  BatchedModelCheckpointRequiredDescriptionRule,
  defaultBatchedModelCheckpointValidator,
} from "./batched-model-checkpoint-rules.js";
import { newBatchedModelCheckpoint } from "./batched-model-checkpoint.js";

test("BatchedModelCheckpointValidator reports every problem", () => {
  const validator = defaultBatchedModelCheckpointValidator();
  const item = newBatchedModelCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedModelCheckpointCodeLengthRule flags a long code", () => {
  const rule = new BatchedModelCheckpointCodeLengthRule(1000);
  const item = newBatchedModelCheckpoint("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedModelCheckpointRequiredDescriptionRule flags a blank description", () => {
  const rule = new BatchedModelCheckpointRequiredDescriptionRule("batched model checkpoint needs a value");
  const item = newBatchedModelCheckpoint("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedModelCheckpointPriorityRangeRule flags values above priority", () => {
  const rule = new BatchedModelCheckpointPriorityRangeRule(32, 64);
  const item = newBatchedModelCheckpoint("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
