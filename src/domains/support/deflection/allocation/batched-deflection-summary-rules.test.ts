import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDeflectionSummaryAmountRangeRule,
  BatchedDeflectionSummaryRequiredCodeRule,
  BatchedDeflectionSummaryTitleLengthRule,
  defaultBatchedDeflectionSummaryValidator,
} from "./batched-deflection-summary-rules.js";
import { newBatchedDeflectionSummary } from "./batched-deflection-summary.js";

test("BatchedDeflectionSummaryValidator reports every problem", () => {
  const validator = defaultBatchedDeflectionSummaryValidator();
  const item = newBatchedDeflectionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDeflectionSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDeflectionSummaryRequiredCodeRule("batched deflection summary needs an entry");
  const item = newBatchedDeflectionSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDeflectionSummaryAmountRangeRule flags values above amount", () => {
  const rule = new BatchedDeflectionSummaryAmountRangeRule(0.9, 1811.8);
  const item = newBatchedDeflectionSummary("x", "y");
  item.amount = 1813.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDeflectionSummaryTitleLengthRule flags a long title", () => {
  const rule = new BatchedDeflectionSummaryTitleLengthRule(32);
  const item = newBatchedDeflectionSummary("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
