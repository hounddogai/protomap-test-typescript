import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPayoutLedgerDiscountRangeRule,
  LenientPayoutLedgerDurationMinutesRangeRule,
  LenientPayoutLedgerNotesLengthRule,
  LenientPayoutLedgerRequiredCodeRule,
  defaultLenientPayoutLedgerValidator,
} from "./lenient-payout-ledger-rules.js";
import { newLenientPayoutLedger } from "./lenient-payout-ledger.js";

test("LenientPayoutLedgerValidator reports every problem", () => {
  const validator = defaultLenientPayoutLedgerValidator();
  const item = newLenientPayoutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPayoutLedgerDiscountRangeRule flags values above discount", () => {
  const rule = new LenientPayoutLedgerDiscountRangeRule(6.7, 3754.2);
  const item = newLenientPayoutLedger("x", "y");
  item.discount = 3755.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPayoutLedgerNotesLengthRule flags a long notes", () => {
  const rule = new LenientPayoutLedgerNotesLengthRule(32);
  const item = newLenientPayoutLedger("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPayoutLedgerDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LenientPayoutLedgerDurationMinutesRangeRule(32, 255);
  const item = newLenientPayoutLedger("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPayoutLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPayoutLedgerRequiredCodeRule("lenient payout ledger needs a value");
  const item = newLenientPayoutLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
