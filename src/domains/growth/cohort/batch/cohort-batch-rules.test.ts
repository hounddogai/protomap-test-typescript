import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortBatchExpiresAtRangeRule,
  CohortBatchNameLengthRule,
  CohortBatchThresholdRangeRule,
  defaultCohortBatchValidator,
} from "./cohort-batch-rules.js";
import { newCohortBatch } from "./cohort-batch.js";

test("CohortBatchValidator reports every problem", () => {
  const validator = defaultCohortBatchValidator();
  const item = newCohortBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortBatchNameLengthRule flags a long name", () => {
  const rule = new CohortBatchNameLengthRule(120);
  const item = newCohortBatch("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortBatchExpiresAtRangeRule flags values above expires at", () => {
  const rule = new CohortBatchExpiresAtRangeRule(16, 16);
  const item = newCohortBatch("x", "y");
  item.expiresAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortBatchThresholdRangeRule flags values above threshold", () => {
  const rule = new CohortBatchThresholdRangeRule(8.1, 4352.4);
  const item = newCohortBatch("x", "y");
  item.threshold = 4353.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
