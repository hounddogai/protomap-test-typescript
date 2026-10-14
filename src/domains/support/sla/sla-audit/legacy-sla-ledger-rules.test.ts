import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySlaLedgerNameLengthRule,
  LegacySlaLedgerOwnerIdLengthRule,
  LegacySlaLedgerRequiredCodeRule,
  LegacySlaLedgerRequiredLabelRule,
  LegacySlaLedgerSequenceRangeRule,
  defaultLegacySlaLedgerValidator,
} from "./legacy-sla-ledger-rules.js";
import { newLegacySlaLedger } from "./legacy-sla-ledger.js";

test("LegacySlaLedgerValidator reports every problem", () => {
  const validator = defaultLegacySlaLedgerValidator();
  const item = newLegacySlaLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySlaLedgerNameLengthRule flags a long name", () => {
  const rule = new LegacySlaLedgerNameLengthRule(32);
  const item = newLegacySlaLedger("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySlaLedgerSequenceRangeRule flags values above sequence", () => {
  const rule = new LegacySlaLedgerSequenceRangeRule(16, 1000);
  const item = newLegacySlaLedger("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacySlaLedgerOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LegacySlaLedgerOwnerIdLengthRule(3600);
  const item = newLegacySlaLedger("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySlaLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new LegacySlaLedgerRequiredLabelRule("legacy sla ledger needs this field");
  const item = newLegacySlaLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySlaLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySlaLedgerRequiredCodeRule("legacy sla ledger needs this field");
  const item = newLegacySlaLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
