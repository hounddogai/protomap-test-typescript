import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWarmupLedgerBatchSizeRangeRule,
  BatchedWarmupLedgerChecksumLengthRule,
  BatchedWarmupLedgerCohortLengthRule,
  BatchedWarmupLedgerRequiredChecksumRule,
  BatchedWarmupLedgerThresholdRangeRule,
  defaultBatchedWarmupLedgerValidator,
} from "./batched-warmup-ledger-rules.js";
import { newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("BatchedWarmupLedgerValidator reports every problem", () => {
  const validator = defaultBatchedWarmupLedgerValidator();
  const item = newBatchedWarmupLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWarmupLedgerCohortLengthRule flags a long cohort", () => {
  const rule = new BatchedWarmupLedgerCohortLengthRule(120);
  const item = newBatchedWarmupLedger("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWarmupLedgerBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedWarmupLedgerBatchSizeRangeRule(255, 3600);
  const item = newBatchedWarmupLedger("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedWarmupLedgerRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BatchedWarmupLedgerRequiredChecksumRule("batched warmup ledger needs a value");
  const item = newBatchedWarmupLedger("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWarmupLedgerThresholdRangeRule flags values above threshold", () => {
  const rule = new BatchedWarmupLedgerThresholdRangeRule(9.1, 3364.4);
  const item = newBatchedWarmupLedger("x", "y");
  item.threshold = 3365.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedWarmupLedgerChecksumLengthRule flags a long checksum", () => {
  const rule = new BatchedWarmupLedgerChecksumLengthRule(120);
  const item = newBatchedWarmupLedger("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
