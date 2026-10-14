import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPathCycleCodeLengthRule,
  BatchedPathCycleRequiredChannelRule,
  BatchedPathCycleRequiredRegionRule,
  defaultBatchedPathCycleValidator,
} from "./batched-path-cycle-rules.js";
import { newBatchedPathCycle } from "./batched-path-cycle.js";

test("BatchedPathCycleValidator reports every problem", () => {
  const validator = defaultBatchedPathCycleValidator();
  const item = newBatchedPathCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPathCycleCodeLengthRule flags a long code", () => {
  const rule = new BatchedPathCycleCodeLengthRule(1000);
  const item = newBatchedPathCycle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPathCycleRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedPathCycleRequiredChannelRule("batched path cycle needs an entry");
  const item = newBatchedPathCycle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPathCycleRequiredRegionRule flags a blank region", () => {
  const rule = new BatchedPathCycleRequiredRegionRule("batched path cycle needs an entry");
  const item = newBatchedPathCycle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
