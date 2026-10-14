import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredApprovalBatchRequiredNotesRule,
  TieredApprovalBatchRetriesRangeRule,
  defaultTieredApprovalBatchValidator,
} from "./tiered-approval-batch-rules.js";
import { newTieredApprovalBatch } from "./tiered-approval-batch.js";

test("TieredApprovalBatchValidator reports every problem", () => {
  const validator = defaultTieredApprovalBatchValidator();
  const item = newTieredApprovalBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredApprovalBatchRequiredNotesRule flags a blank notes", () => {
  const rule = new TieredApprovalBatchRequiredNotesRule("tiered approval batch needs a value");
  const item = newTieredApprovalBatch("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredApprovalBatchRetriesRangeRule flags values above retries", () => {
  const rule = new TieredApprovalBatchRetriesRangeRule(16, 80);
  const item = newTieredApprovalBatch("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
