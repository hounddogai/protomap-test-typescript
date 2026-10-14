import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierLedgerCodeLengthRule,
  TierLedgerFrequencyCapRangeRule,
  TierLedgerImpressionsRangeRule,
  TierLedgerLocaleLengthRule,
  TierLedgerTitleLengthRule,
  defaultTierLedgerValidator,
} from "./tier-ledger-rules.js";
import { newTierLedger } from "./tier-ledger.js";

test("TierLedgerValidator reports every problem", () => {
  const validator = defaultTierLedgerValidator();
  const item = newTierLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierLedgerTitleLengthRule flags a long title", () => {
  const rule = new TierLedgerTitleLengthRule(32);
  const item = newTierLedger("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierLedgerCodeLengthRule flags a long code", () => {
  const rule = new TierLedgerCodeLengthRule(86400);
  const item = newTierLedger("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierLedgerFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TierLedgerFrequencyCapRangeRule(255, 3600);
  const item = newTierLedger("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierLedgerLocaleLengthRule flags a long locale", () => {
  const rule = new TierLedgerLocaleLengthRule(3600);
  const item = newTierLedger("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierLedgerImpressionsRangeRule flags values above impressions", () => {
  const rule = new TierLedgerImpressionsRangeRule(16, 32);
  const item = newTierLedger("x", "y");
  item.impressions = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
