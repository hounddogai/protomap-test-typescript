import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPayoutLedgerAttemptsRangeRule,
  PendingPayoutLedgerLabelLengthRule,
  PendingPayoutLedgerThresholdRangeRule,
  defaultPendingPayoutLedgerValidator,
} from "./pending-payout-ledger-rules.js";
import { newPendingPayoutLedger } from "./pending-payout-ledger.js";

test("PendingPayoutLedgerValidator reports every problem", () => {
  const validator = defaultPendingPayoutLedgerValidator();
  const item = newPendingPayoutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPayoutLedgerThresholdRangeRule flags values above threshold", () => {
  const rule = new PendingPayoutLedgerThresholdRangeRule(1.5, 3702.6);
  const item = newPendingPayoutLedger("x", "y");
  item.threshold = 3704.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPayoutLedgerAttemptsRangeRule flags values above attempts", () => {
  const rule = new PendingPayoutLedgerAttemptsRangeRule(1000, 3600);
  const item = newPendingPayoutLedger("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPayoutLedgerLabelLengthRule flags a long label", () => {
  const rule = new PendingPayoutLedgerLabelLengthRule(16);
  const item = newPendingPayoutLedger("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
