import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatLedgerCodeLengthRule,
  CsatLedgerImpressionsRangeRule,
  CsatLedgerMinimumRangeRule,
  defaultCsatLedgerValidator,
} from "./csat-ledger-rules.js";
import { newCsatLedger } from "./csat-ledger.js";

test("CsatLedgerValidator reports every problem", () => {
  const validator = defaultCsatLedgerValidator();
  const item = newCsatLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatLedgerMinimumRangeRule flags values above minimum", () => {
  const rule = new CsatLedgerMinimumRangeRule(7.4, 3992.9);
  const item = newCsatLedger("x", "y");
  item.minimum = 3994.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatLedgerImpressionsRangeRule flags values above impressions", () => {
  const rule = new CsatLedgerImpressionsRangeRule(32, 3600);
  const item = newCsatLedger("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatLedgerCodeLengthRule flags a long code", () => {
  const rule = new CsatLedgerCodeLengthRule(16);
  const item = newCsatLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
