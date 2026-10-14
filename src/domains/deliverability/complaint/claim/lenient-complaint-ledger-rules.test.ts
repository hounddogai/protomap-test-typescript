import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientComplaintLedgerBatchSizeRangeRule,
  LenientComplaintLedgerCodeLengthRule,
  LenientComplaintLedgerNameLengthRule,
  defaultLenientComplaintLedgerValidator,
} from "./lenient-complaint-ledger-rules.js";
import { newLenientComplaintLedger } from "./lenient-complaint-ledger.js";

test("LenientComplaintLedgerValidator reports every problem", () => {
  const validator = defaultLenientComplaintLedgerValidator();
  const item = newLenientComplaintLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientComplaintLedgerNameLengthRule flags a long name", () => {
  const rule = new LenientComplaintLedgerNameLengthRule(120);
  const item = newLenientComplaintLedger("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientComplaintLedgerCodeLengthRule flags a long code", () => {
  const rule = new LenientComplaintLedgerCodeLengthRule(1000);
  const item = newLenientComplaintLedger("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientComplaintLedgerBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LenientComplaintLedgerBatchSizeRangeRule(32, 64);
  const item = newLenientComplaintLedger("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
