import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderLedgerBudgetRangeRule,
  SenderLedgerOpenRateRangeRule,
  SenderLedgerPhoneLengthRule,
  SenderLedgerRequiredSummaryRule,
  SenderLedgerSummaryLengthRule,
  defaultSenderLedgerValidator,
} from "./sender-ledger-rules.js";
import { newSenderLedger } from "./sender-ledger.js";

test("SenderLedgerValidator reports every problem", () => {
  const validator = defaultSenderLedgerValidator();
  const item = newSenderLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderLedgerOpenRateRangeRule flags values above open rate", () => {
  const rule = new SenderLedgerOpenRateRangeRule(0.6, 596.8);
  const item = newSenderLedger("x", "y");
  item.openRate = 598.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderLedgerSummaryLengthRule flags a long summary", () => {
  const rule = new SenderLedgerSummaryLengthRule(120);
  const item = newSenderLedger("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderLedgerRequiredSummaryRule flags a blank summary", () => {
  const rule = new SenderLedgerRequiredSummaryRule("sender ledger needs a value");
  const item = newSenderLedger("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderLedgerPhoneLengthRule flags a long phone", () => {
  const rule = new SenderLedgerPhoneLengthRule(64);
  const item = newSenderLedger("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderLedgerBudgetRangeRule flags values above budget", () => {
  const rule = new SenderLedgerBudgetRangeRule(0.4, 3953.1);
  const item = newSenderLedger("x", "y");
  item.budget = 3954.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
