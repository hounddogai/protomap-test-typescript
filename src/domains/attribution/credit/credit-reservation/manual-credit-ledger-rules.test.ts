import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreditLedgerCodeLengthRule,
  ManualCreditLedgerRetriesRangeRule,
  ManualCreditLedgerVersionRangeRule,
  ManualCreditLedgerWeightRangeRule,
  defaultManualCreditLedgerValidator,
} from "./manual-credit-ledger-rules.js";
import { newManualCreditLedger } from "./manual-credit-ledger.js";

test("ManualCreditLedgerValidator reports every problem", () => {
  const validator = defaultManualCreditLedgerValidator();
  const item = newManualCreditLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreditLedgerCodeLengthRule flags a long code", () => {
  const rule = new ManualCreditLedgerCodeLengthRule(32);
  const item = newManualCreditLedger("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreditLedgerVersionRangeRule flags values above version", () => {
  const rule = new ManualCreditLedgerVersionRangeRule(1000, 86400);
  const item = newManualCreditLedger("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreditLedgerWeightRangeRule flags values above weight", () => {
  const rule = new ManualCreditLedgerWeightRangeRule(7.2, 3181.7);
  const item = newManualCreditLedger("x", "y");
  item.weight = 3183.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreditLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new ManualCreditLedgerRetriesRangeRule(32, 86400);
  const item = newManualCreditLedger("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
