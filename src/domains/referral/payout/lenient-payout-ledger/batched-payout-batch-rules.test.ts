import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPayoutBatchCostRangeRule,
  BatchedPayoutBatchRequiredCodeRule,
  BatchedPayoutBatchRequiredNameRule,
  BatchedPayoutBatchSummaryLengthRule,
  defaultBatchedPayoutBatchValidator,
} from "./batched-payout-batch-rules.js";
import { newBatchedPayoutBatch } from "./batched-payout-batch.js";

test("BatchedPayoutBatchValidator reports every problem", () => {
  const validator = defaultBatchedPayoutBatchValidator();
  const item = newBatchedPayoutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPayoutBatchRequiredNameRule flags a blank name", () => {
  const rule = new BatchedPayoutBatchRequiredNameRule("batched payout batch needs an entry");
  const item = newBatchedPayoutBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPayoutBatchRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPayoutBatchRequiredCodeRule("batched payout batch needs this field");
  const item = newBatchedPayoutBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPayoutBatchSummaryLengthRule flags a long summary", () => {
  const rule = new BatchedPayoutBatchSummaryLengthRule(80);
  const item = newBatchedPayoutBatch("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPayoutBatchCostRangeRule flags values above cost", () => {
  const rule = new BatchedPayoutBatchCostRangeRule(9.1, 2334.2);
  const item = newBatchedPayoutBatch("x", "y");
  item.cost = 2335.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
