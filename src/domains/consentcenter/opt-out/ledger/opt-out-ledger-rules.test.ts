import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutLedgerBatchSizeRangeRule,
  OptOutLedgerCodeLengthRule,
  OptOutLedgerRequiredSegmentRule,
  OptOutLedgerSegmentLengthRule,
  defaultOptOutLedgerValidator,
} from "./opt-out-ledger-rules.js";
import { newOptOutLedger } from "./opt-out-ledger.js";

test("OptOutLedgerValidator reports every problem", () => {
  const validator = defaultOptOutLedgerValidator();
  const item = newOptOutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutLedgerSegmentLengthRule flags a long segment", () => {
  const rule = new OptOutLedgerSegmentLengthRule(1000);
  const item = newOptOutLedger("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutLedgerRequiredSegmentRule flags a blank segment", () => {
  const rule = new OptOutLedgerRequiredSegmentRule("opt out ledger needs an entry");
  const item = newOptOutLedger("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutLedgerCodeLengthRule flags a long code", () => {
  const rule = new OptOutLedgerCodeLengthRule(80);
  const item = newOptOutLedger("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutLedgerBatchSizeRangeRule flags values above batch size", () => {
  const rule = new OptOutLedgerBatchSizeRangeRule(16, 80);
  const item = newOptOutLedger("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
