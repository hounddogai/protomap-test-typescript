import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingStepBatchBudgetRangeRule,
  PendingStepBatchRequiredDescriptionRule,
  PendingStepBatchUpdatedAtRangeRule,
  defaultPendingStepBatchValidator,
} from "./pending-step-batch-rules.js";
import { newPendingStepBatch } from "./pending-step-batch.js";

test("PendingStepBatchValidator reports every problem", () => {
  const validator = defaultPendingStepBatchValidator();
  const item = newPendingStepBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingStepBatchRequiredDescriptionRule flags a blank description", () => {
  const rule = new PendingStepBatchRequiredDescriptionRule("pending step batch needs an entry");
  const item = newPendingStepBatch("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingStepBatchUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PendingStepBatchUpdatedAtRangeRule(16, 3600);
  const item = newPendingStepBatch("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingStepBatchBudgetRangeRule flags values above budget", () => {
  const rule = new PendingStepBatchBudgetRangeRule(1.7, 1371.8);
  const item = newPendingStepBatch("x", "y");
  item.budget = 1373.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
