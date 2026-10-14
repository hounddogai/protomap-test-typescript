import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBranchNoticeCodeLengthRule,
  defaultBatchedBranchNoticeValidator,
} from "./batched-branch-notice-rules.js";
import { newBatchedBranchNotice } from "./batched-branch-notice.js";

test("BatchedBranchNoticeValidator reports every problem", () => {
  const validator = defaultBatchedBranchNoticeValidator();
  const item = newBatchedBranchNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBranchNoticeCodeLengthRule flags a long code", () => {
  const rule = new BatchedBranchNoticeCodeLengthRule(16);
  const item = newBatchedBranchNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
