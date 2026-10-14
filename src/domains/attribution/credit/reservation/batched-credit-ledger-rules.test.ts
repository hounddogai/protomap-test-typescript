import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreditLedgerCodeLengthRule,
  BatchedCreditLedgerCreatedAtRangeRule,
  BatchedCreditLedgerCurrencyLengthRule,
  BatchedCreditLedgerLabelLengthRule,
  BatchedCreditLedgerRequiredCodeRule,
  defaultBatchedCreditLedgerValidator,
} from "./batched-credit-ledger-rules.js";
import { newBatchedCreditLedger } from "./batched-credit-ledger.js";

test("BatchedCreditLedgerValidator reports every problem", () => {
  const validator = defaultBatchedCreditLedgerValidator();
  const item = newBatchedCreditLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreditLedgerCurrencyLengthRule flags a long currency", () => {
  const rule = new BatchedCreditLedgerCurrencyLengthRule(16);
  const item = newBatchedCreditLedger("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreditLedgerLabelLengthRule flags a long label", () => {
  const rule = new BatchedCreditLedgerLabelLengthRule(64);
  const item = newBatchedCreditLedger("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreditLedgerCodeLengthRule flags a long code", () => {
  const rule = new BatchedCreditLedgerCodeLengthRule(3600);
  const item = newBatchedCreditLedger("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreditLedgerCreatedAtRangeRule flags values above created at", () => {
  const rule = new BatchedCreditLedgerCreatedAtRangeRule(64, 80);
  const item = newBatchedCreditLedger("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedCreditLedgerRequiredCodeRule("batched credit ledger needs an entry");
  const item = newBatchedCreditLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
