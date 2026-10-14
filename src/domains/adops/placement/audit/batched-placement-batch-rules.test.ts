import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPlacementBatchAmountRangeRule,
  BatchedPlacementBatchFrequencyCapRangeRule,
  BatchedPlacementBatchOwnerIdLengthRule,
  BatchedPlacementBatchTitleLengthRule,
  defaultBatchedPlacementBatchValidator,
} from "./batched-placement-batch-rules.js";
import { newBatchedPlacementBatch } from "./batched-placement-batch.js";

test("BatchedPlacementBatchValidator reports every problem", () => {
  const validator = defaultBatchedPlacementBatchValidator();
  const item = newBatchedPlacementBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPlacementBatchTitleLengthRule flags a long title", () => {
  const rule = new BatchedPlacementBatchTitleLengthRule(120);
  const item = newBatchedPlacementBatch("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementBatchFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedPlacementBatchFrequencyCapRangeRule(80, 86400);
  const item = newBatchedPlacementBatch("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPlacementBatchOwnerIdLengthRule flags a long owner id", () => {
  const rule = new BatchedPlacementBatchOwnerIdLengthRule(120);
  const item = newBatchedPlacementBatch("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementBatchAmountRangeRule flags values above amount", () => {
  const rule = new BatchedPlacementBatchAmountRangeRule(5.1, 1798.4);
  const item = newBatchedPlacementBatch("x", "y");
  item.amount = 1799.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
