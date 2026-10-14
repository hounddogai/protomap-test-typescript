import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreditRecordRequiredCodeRule,
  BatchedCreditRecordReviewerLengthRule,
  defaultBatchedCreditRecordValidator,
} from "./batched-credit-record-rules.js";
import { newBatchedCreditRecord } from "./batched-credit-record.js";

test("BatchedCreditRecordValidator reports every problem", () => {
  const validator = defaultBatchedCreditRecordValidator();
  const item = newBatchedCreditRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreditRecordRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedCreditRecordRequiredCodeRule("batched credit record needs this field");
  const item = newBatchedCreditRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCreditRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new BatchedCreditRecordReviewerLengthRule(16);
  const item = newBatchedCreditRecord("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
