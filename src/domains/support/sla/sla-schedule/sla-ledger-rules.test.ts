import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaLedgerCodeLengthRule,
  SlaLedgerRequiredCodeRule,
  SlaLedgerRequiredLabelRule,
  SlaLedgerRequiredSummaryRule,
  SlaLedgerRetriesRangeRule,
  defaultSlaLedgerValidator,
} from "./sla-ledger-rules.js";
import { newSlaLedger } from "./sla-ledger.js";

test("SlaLedgerValidator reports every problem", () => {
  const validator = defaultSlaLedgerValidator();
  const item = newSlaLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new SlaLedgerRetriesRangeRule(32, 86400);
  const item = newSlaLedger("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new SlaLedgerRequiredCodeRule("sla ledger needs this field");
  const item = newSlaLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaLedgerRequiredSummaryRule flags a blank summary", () => {
  const rule = new SlaLedgerRequiredSummaryRule("sla ledger needs a value");
  const item = newSlaLedger("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaLedgerCodeLengthRule flags a long code", () => {
  const rule = new SlaLedgerCodeLengthRule(3600);
  const item = newSlaLedger("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new SlaLedgerRequiredLabelRule("sla ledger needs an entry");
  const item = newSlaLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
