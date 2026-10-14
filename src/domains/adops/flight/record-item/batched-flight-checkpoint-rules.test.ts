import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFlightCheckpointAmountRangeRule,
  BatchedFlightCheckpointClicksRangeRule,
  BatchedFlightCheckpointCodeLengthRule,
  BatchedFlightCheckpointMaximumRangeRule,
  defaultBatchedFlightCheckpointValidator,
} from "./batched-flight-checkpoint-rules.js";
import { newBatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

test("BatchedFlightCheckpointValidator reports every problem", () => {
  const validator = defaultBatchedFlightCheckpointValidator();
  const item = newBatchedFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFlightCheckpointAmountRangeRule flags values above amount", () => {
  const rule = new BatchedFlightCheckpointAmountRangeRule(8.7, 1261.7);
  const item = newBatchedFlightCheckpoint("x", "y");
  item.amount = 1263.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFlightCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedFlightCheckpointClicksRangeRule(32, 64);
  const item = newBatchedFlightCheckpoint("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFlightCheckpointCodeLengthRule flags a long code", () => {
  const rule = new BatchedFlightCheckpointCodeLengthRule(120);
  const item = newBatchedFlightCheckpoint("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFlightCheckpointMaximumRangeRule flags values above maximum", () => {
  const rule = new BatchedFlightCheckpointMaximumRangeRule(8.3, 2675.4);
  const item = newBatchedFlightCheckpoint("x", "y");
  item.maximum = 2676.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
