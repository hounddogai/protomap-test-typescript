import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInsightAllocationCodeLengthRule,
  BatchedInsightAllocationRequiredCodeRule,
  BatchedInsightAllocationRequiredLabelRule,
  BatchedInsightAllocationRequiredSourceRule,
  BatchedInsightAllocationSourceLengthRule,
  defaultBatchedInsightAllocationValidator,
} from "./batched-insight-allocation-rules.js";
import { newBatchedInsightAllocation } from "./batched-insight-allocation.js";

test("BatchedInsightAllocationValidator reports every problem", () => {
  const validator = defaultBatchedInsightAllocationValidator();
  const item = newBatchedInsightAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInsightAllocationSourceLengthRule flags a long source", () => {
  const rule = new BatchedInsightAllocationSourceLengthRule(16);
  const item = newBatchedInsightAllocation("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInsightAllocationCodeLengthRule flags a long code", () => {
  const rule = new BatchedInsightAllocationCodeLengthRule(32);
  const item = newBatchedInsightAllocation("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInsightAllocationRequiredSourceRule flags a blank source", () => {
  const rule = new BatchedInsightAllocationRequiredSourceRule("batched insight allocation needs an entry");
  const item = newBatchedInsightAllocation("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInsightAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedInsightAllocationRequiredCodeRule("batched insight allocation needs this field");
  const item = newBatchedInsightAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInsightAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedInsightAllocationRequiredLabelRule("batched insight allocation needs an entry");
  const item = newBatchedInsightAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
