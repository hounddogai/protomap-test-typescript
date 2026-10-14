import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditLedgerCodeLengthRule,
  CreditLedgerDescriptionLengthRule,
  CreditLedgerRequiredCodeRule,
  CreditLedgerRequiredDescriptionRule,
  CreditLedgerRequiredLocaleRule,
  CreditLedgerSequenceRangeRule,
  defaultCreditLedgerValidator,
} from "./credit-ledger-rules.js";
import { newCreditLedger } from "./credit-ledger.js";

test("CreditLedgerValidator reports every problem", () => {
  const validator = defaultCreditLedgerValidator();
  const item = newCreditLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditLedgerCodeLengthRule flags a long code", () => {
  const rule = new CreditLedgerCodeLengthRule(16);
  const item = newCreditLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new CreditLedgerRequiredCodeRule("credit ledger needs this field");
  const item = newCreditLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditLedgerRequiredDescriptionRule flags a blank description", () => {
  const rule = new CreditLedgerRequiredDescriptionRule("credit ledger needs an entry");
  const item = newCreditLedger("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditLedgerRequiredLocaleRule flags a blank locale", () => {
  const rule = new CreditLedgerRequiredLocaleRule("credit ledger needs an entry");
  const item = newCreditLedger("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new CreditLedgerDescriptionLengthRule(80);
  const item = newCreditLedger("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditLedgerSequenceRangeRule flags values above sequence", () => {
  const rule = new CreditLedgerSequenceRangeRule(32, 1000);
  const item = newCreditLedger("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
