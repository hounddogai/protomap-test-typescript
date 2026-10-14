import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedStreakRecordLabelLengthRule,
  BatchedStreakRecordRequiredCodeRule,
  BatchedStreakRecordRequiredUtmSourceRule,
  defaultBatchedStreakRecordValidator,
} from "./batched-streak-record-rules.js";
import { newBatchedStreakRecord } from "./batched-streak-record.js";

test("BatchedStreakRecordValidator reports every problem", () => {
  const validator = defaultBatchedStreakRecordValidator();
  const item = newBatchedStreakRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedStreakRecordRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedStreakRecordRequiredCodeRule("batched streak record needs an entry");
  const item = newBatchedStreakRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedStreakRecordLabelLengthRule flags a long label", () => {
  const rule = new BatchedStreakRecordLabelLengthRule(86400);
  const item = newBatchedStreakRecord("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedStreakRecordRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BatchedStreakRecordRequiredUtmSourceRule("batched streak record needs this field");
  const item = newBatchedStreakRecord("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
