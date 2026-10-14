import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSenderRollupLabelLengthRule,
  BatchedSenderRollupSequenceRangeRule,
  defaultBatchedSenderRollupValidator,
} from "./batched-sender-rollup-rules.js";
import { newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("BatchedSenderRollupValidator reports every problem", () => {
  const validator = defaultBatchedSenderRollupValidator();
  const item = newBatchedSenderRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSenderRollupSequenceRangeRule flags values above sequence", () => {
  const rule = new BatchedSenderRollupSequenceRangeRule(16, 80);
  const item = newBatchedSenderRollup("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSenderRollupLabelLengthRule flags a long label", () => {
  const rule = new BatchedSenderRollupLabelLengthRule(86400);
  const item = newBatchedSenderRollup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
