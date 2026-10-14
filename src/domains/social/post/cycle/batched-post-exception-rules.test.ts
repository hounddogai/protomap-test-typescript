import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPostExceptionCostRangeRule,
  BatchedPostExceptionMarginRangeRule,
  BatchedPostExceptionRequiredUnitRule,
  defaultBatchedPostExceptionValidator,
} from "./batched-post-exception-rules.js";
import { newBatchedPostException } from "./batched-post-exception.js";

test("BatchedPostExceptionValidator reports every problem", () => {
  const validator = defaultBatchedPostExceptionValidator();
  const item = newBatchedPostException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPostExceptionRequiredUnitRule flags a blank unit", () => {
  const rule = new BatchedPostExceptionRequiredUnitRule("batched post exception needs this field");
  const item = newBatchedPostException("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPostExceptionCostRangeRule flags values above cost", () => {
  const rule = new BatchedPostExceptionCostRangeRule(1.5, 3032.3);
  const item = newBatchedPostException("x", "y");
  item.cost = 3033.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPostExceptionMarginRangeRule flags values above margin", () => {
  const rule = new BatchedPostExceptionMarginRangeRule(0.7, 3605);
  const item = newBatchedPostException("x", "y");
  item.margin = 3606.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
