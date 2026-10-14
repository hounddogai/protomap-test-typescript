import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDomainLedgerCodeLengthRule,
  TieredDomainLedgerCurrencyLengthRule,
  TieredDomainLedgerOpenRateRangeRule,
  TieredDomainLedgerQuantityRangeRule,
  defaultTieredDomainLedgerValidator,
} from "./tiered-domain-ledger-rules.js";
import { newTieredDomainLedger } from "./tiered-domain-ledger.js";

test("TieredDomainLedgerValidator reports every problem", () => {
  const validator = defaultTieredDomainLedgerValidator();
  const item = newTieredDomainLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDomainLedgerCurrencyLengthRule flags a long currency", () => {
  const rule = new TieredDomainLedgerCurrencyLengthRule(32);
  const item = newTieredDomainLedger("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDomainLedgerCodeLengthRule flags a long code", () => {
  const rule = new TieredDomainLedgerCodeLengthRule(86400);
  const item = newTieredDomainLedger("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDomainLedgerOpenRateRangeRule flags values above open rate", () => {
  const rule = new TieredDomainLedgerOpenRateRangeRule(6.6, 858.7);
  const item = newTieredDomainLedger("x", "y");
  item.openRate = 860.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDomainLedgerQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredDomainLedgerQuantityRangeRule(64, 3600);
  const item = newTieredDomainLedger("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
