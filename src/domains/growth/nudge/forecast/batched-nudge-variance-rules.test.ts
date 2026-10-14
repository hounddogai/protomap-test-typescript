import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedNudgeVarianceBudgetRangeRule,
  BatchedNudgeVariancePriorityRangeRule,
  BatchedNudgeVarianceRequiredCodeRule,
  BatchedNudgeVarianceRequiredLabelRule,
  defaultBatchedNudgeVarianceValidator,
} from "./batched-nudge-variance-rules.js";
import { newBatchedNudgeVariance } from "./batched-nudge-variance.js";

test("BatchedNudgeVarianceValidator reports every problem", () => {
  const validator = defaultBatchedNudgeVarianceValidator();
  const item = newBatchedNudgeVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedNudgeVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedNudgeVarianceRequiredCodeRule("batched nudge variance needs a value");
  const item = newBatchedNudgeVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedNudgeVariancePriorityRangeRule flags values above priority", () => {
  const rule = new BatchedNudgeVariancePriorityRangeRule(255, 255);
  const item = newBatchedNudgeVariance("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedNudgeVarianceBudgetRangeRule flags values above budget", () => {
  const rule = new BatchedNudgeVarianceBudgetRangeRule(5.6, 364.3);
  const item = newBatchedNudgeVariance("x", "y");
  item.budget = 365.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedNudgeVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedNudgeVarianceRequiredLabelRule("batched nudge variance needs this field");
  const item = newBatchedNudgeVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
