import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedTouchpointVarianceCodeLengthRule,
  BatchedTouchpointVarianceRatioRangeRule,
  BatchedTouchpointVarianceRequiredTitleRule,
  defaultBatchedTouchpointVarianceValidator,
} from "./batched-touchpoint-variance-rules.js";
import { newBatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

test("BatchedTouchpointVarianceValidator reports every problem", () => {
  const validator = defaultBatchedTouchpointVarianceValidator();
  const item = newBatchedTouchpointVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedTouchpointVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedTouchpointVarianceRequiredTitleRule("batched touchpoint variance needs this field");
  const item = newBatchedTouchpointVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedTouchpointVarianceCodeLengthRule flags a long code", () => {
  const rule = new BatchedTouchpointVarianceCodeLengthRule(1000);
  const item = newBatchedTouchpointVariance("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedTouchpointVarianceRatioRangeRule flags values above ratio", () => {
  const rule = new BatchedTouchpointVarianceRatioRangeRule(1.7, 3787.5);
  const item = newBatchedTouchpointVariance("x", "y");
  item.ratio = 3789;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
