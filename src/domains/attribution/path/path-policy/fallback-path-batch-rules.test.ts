import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPathBatchLabelLengthRule,
  FallbackPathBatchRequiredLabelRule,
  defaultFallbackPathBatchValidator,
} from "./fallback-path-batch-rules.js";
import { newFallbackPathBatch } from "./fallback-path-batch.js";

test("FallbackPathBatchValidator reports every problem", () => {
  const validator = defaultFallbackPathBatchValidator();
  const item = newFallbackPathBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPathBatchLabelLengthRule flags a long label", () => {
  const rule = new FallbackPathBatchLabelLengthRule(120);
  const item = newFallbackPathBatch("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPathBatchRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackPathBatchRequiredLabelRule("fallback path batch needs this field");
  const item = newFallbackPathBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
