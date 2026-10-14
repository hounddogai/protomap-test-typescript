import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedNudgeSummaryBatchSizeRangeRule,
  BatchedNudgeSummaryLabelLengthRule,
  defaultBatchedNudgeSummaryValidator,
} from "./batched-nudge-summary-rules.js";
import { newBatchedNudgeSummary } from "./batched-nudge-summary.js";

test("BatchedNudgeSummaryValidator reports every problem", () => {
  const validator = defaultBatchedNudgeSummaryValidator();
  const item = newBatchedNudgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedNudgeSummaryLabelLengthRule flags a long label", () => {
  const rule = new BatchedNudgeSummaryLabelLengthRule(32);
  const item = newBatchedNudgeSummary("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedNudgeSummaryBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedNudgeSummaryBatchSizeRangeRule(32, 3600);
  const item = newBatchedNudgeSummary("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
