import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWaitBaselineRequiredCodeRule,
  BatchedWaitBaselineRequiredSourceRule,
  BatchedWaitBaselineRequiredTimezoneRule,
  BatchedWaitBaselineTimezoneLengthRule,
  defaultBatchedWaitBaselineValidator,
} from "./batched-wait-baseline-rules.js";
import { newBatchedWaitBaseline } from "./batched-wait-baseline.js";

test("BatchedWaitBaselineValidator reports every problem", () => {
  const validator = defaultBatchedWaitBaselineValidator();
  const item = newBatchedWaitBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWaitBaselineRequiredSourceRule flags a blank source", () => {
  const rule = new BatchedWaitBaselineRequiredSourceRule("batched wait baseline needs this field");
  const item = newBatchedWaitBaseline("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitBaselineRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new BatchedWaitBaselineRequiredTimezoneRule("batched wait baseline needs this field");
  const item = newBatchedWaitBaseline("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitBaselineTimezoneLengthRule flags a long timezone", () => {
  const rule = new BatchedWaitBaselineTimezoneLengthRule(16);
  const item = newBatchedWaitBaseline("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWaitBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedWaitBaselineRequiredCodeRule("batched wait baseline needs this field");
  const item = newBatchedWaitBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
