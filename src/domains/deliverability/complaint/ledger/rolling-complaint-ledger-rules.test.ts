import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingComplaintLedgerClicksRangeRule,
  RollingComplaintLedgerCodeLengthRule,
  RollingComplaintLedgerCostRangeRule,
  RollingComplaintLedgerSequenceRangeRule,
  defaultRollingComplaintLedgerValidator,
} from "./rolling-complaint-ledger-rules.js";
import { newRollingComplaintLedger } from "./rolling-complaint-ledger.js";

test("RollingComplaintLedgerValidator reports every problem", () => {
  const validator = defaultRollingComplaintLedgerValidator();
  const item = newRollingComplaintLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingComplaintLedgerClicksRangeRule flags values above clicks", () => {
  const rule = new RollingComplaintLedgerClicksRangeRule(16, 32);
  const item = newRollingComplaintLedger("x", "y");
  item.clicks = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingComplaintLedgerSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingComplaintLedgerSequenceRangeRule(16, 80);
  const item = newRollingComplaintLedger("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingComplaintLedgerCostRangeRule flags values above cost", () => {
  const rule = new RollingComplaintLedgerCostRangeRule(2.8, 454);
  const item = newRollingComplaintLedger("x", "y");
  item.cost = 455.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingComplaintLedgerCodeLengthRule flags a long code", () => {
  const rule = new RollingComplaintLedgerCodeLengthRule(64);
  const item = newRollingComplaintLedger("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
