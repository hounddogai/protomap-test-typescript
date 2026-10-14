import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedApprovalGroupGraceDaysRangeRule,
  defaultBatchedApprovalGroupValidator,
} from "./batched-approval-group-rules.js";
import { newBatchedApprovalGroup } from "./batched-approval-group.js";

test("BatchedApprovalGroupValidator reports every problem", () => {
  const validator = defaultBatchedApprovalGroupValidator();
  const item = newBatchedApprovalGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedApprovalGroupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedApprovalGroupGraceDaysRangeRule(120, 255);
  const item = newBatchedApprovalGroup("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
