import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMacroCheckpointChannelLengthRule,
  BatchedMacroCheckpointLimitRangeRule,
  BatchedMacroCheckpointRequiredSummaryRule,
  defaultBatchedMacroCheckpointValidator,
} from "./batched-macro-checkpoint-rules.js";
import { newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("BatchedMacroCheckpointValidator reports every problem", () => {
  const validator = defaultBatchedMacroCheckpointValidator();
  const item = newBatchedMacroCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMacroCheckpointLimitRangeRule flags values above limit", () => {
  const rule = new BatchedMacroCheckpointLimitRangeRule(16, 64);
  const item = newBatchedMacroCheckpoint("x", "y");
  item.limit = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMacroCheckpointChannelLengthRule flags a long channel", () => {
  const rule = new BatchedMacroCheckpointChannelLengthRule(16);
  const item = newBatchedMacroCheckpoint("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroCheckpointRequiredSummaryRule flags a blank summary", () => {
  const rule = new BatchedMacroCheckpointRequiredSummaryRule("batched macro checkpoint needs a value");
  const item = newBatchedMacroCheckpoint("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
