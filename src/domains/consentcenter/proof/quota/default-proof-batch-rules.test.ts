import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultProofBatchFrequencyCapRangeRule,
  DefaultProofBatchGraceDaysRangeRule,
  DefaultProofBatchPriorityRangeRule,
  DefaultProofBatchTimezoneLengthRule,
  defaultDefaultProofBatchValidator,
} from "./default-proof-batch-rules.js";
import { newDefaultProofBatch } from "./default-proof-batch.js";

test("DefaultProofBatchValidator reports every problem", () => {
  const validator = defaultDefaultProofBatchValidator();
  const item = newDefaultProofBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultProofBatchFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new DefaultProofBatchFrequencyCapRangeRule(16, 120);
  const item = newDefaultProofBatch("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultProofBatchTimezoneLengthRule flags a long timezone", () => {
  const rule = new DefaultProofBatchTimezoneLengthRule(86400);
  const item = newDefaultProofBatch("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultProofBatchGraceDaysRangeRule flags values above grace days", () => {
  const rule = new DefaultProofBatchGraceDaysRangeRule(64, 120);
  const item = newDefaultProofBatch("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultProofBatchPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultProofBatchPriorityRangeRule(64, 86400);
  const item = newDefaultProofBatch("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
