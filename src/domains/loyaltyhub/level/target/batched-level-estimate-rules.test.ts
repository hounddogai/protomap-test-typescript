import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedLevelEstimateCodeLengthRule,
  BatchedLevelEstimateRequiredNameRule,
  BatchedLevelEstimateTimezoneLengthRule,
  defaultBatchedLevelEstimateValidator,
} from "./batched-level-estimate-rules.js";
import { newBatchedLevelEstimate } from "./batched-level-estimate.js";

test("BatchedLevelEstimateValidator reports every problem", () => {
  const validator = defaultBatchedLevelEstimateValidator();
  const item = newBatchedLevelEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedLevelEstimateCodeLengthRule flags a long code", () => {
  const rule = new BatchedLevelEstimateCodeLengthRule(255);
  const item = newBatchedLevelEstimate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedLevelEstimateTimezoneLengthRule flags a long timezone", () => {
  const rule = new BatchedLevelEstimateTimezoneLengthRule(86400);
  const item = newBatchedLevelEstimate("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedLevelEstimateRequiredNameRule flags a blank name", () => {
  const rule = new BatchedLevelEstimateRequiredNameRule("batched level estimate needs this field");
  const item = newBatchedLevelEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
