import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPayoutLedgerBidRangeRule,
  DefaultPayoutLedgerExternalRefLengthRule,
  DefaultPayoutLedgerPhoneLengthRule,
  DefaultPayoutLedgerRequiredPhoneRule,
  DefaultPayoutLedgerRequiredTitleRule,
  defaultDefaultPayoutLedgerValidator,
} from "./default-payout-ledger-rules.js";
import { newDefaultPayoutLedger } from "./default-payout-ledger.js";

test("DefaultPayoutLedgerValidator reports every problem", () => {
  const validator = defaultDefaultPayoutLedgerValidator();
  const item = newDefaultPayoutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPayoutLedgerBidRangeRule flags values above bid", () => {
  const rule = new DefaultPayoutLedgerBidRangeRule(8.9, 3634);
  const item = newDefaultPayoutLedger("x", "y");
  item.bid = 3635.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPayoutLedgerRequiredPhoneRule flags a blank phone", () => {
  const rule = new DefaultPayoutLedgerRequiredPhoneRule("default payout ledger needs a value");
  const item = newDefaultPayoutLedger("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPayoutLedgerPhoneLengthRule flags a long phone", () => {
  const rule = new DefaultPayoutLedgerPhoneLengthRule(32);
  const item = newDefaultPayoutLedger("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPayoutLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultPayoutLedgerRequiredTitleRule("default payout ledger needs an entry");
  const item = newDefaultPayoutLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPayoutLedgerExternalRefLengthRule flags a long external ref", () => {
  const rule = new DefaultPayoutLedgerExternalRefLengthRule(80);
  const item = newDefaultPayoutLedger("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
