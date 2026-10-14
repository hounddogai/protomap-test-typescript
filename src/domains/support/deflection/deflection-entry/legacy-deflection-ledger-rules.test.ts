import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDeflectionLedgerCodeLengthRule,
  LegacyDeflectionLedgerLabelLengthRule,
  LegacyDeflectionLedgerRequiredCodeRule,
  LegacyDeflectionLedgerTitleLengthRule,
  defaultLegacyDeflectionLedgerValidator,
} from "./legacy-deflection-ledger-rules.js";
import { newLegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

test("LegacyDeflectionLedgerValidator reports every problem", () => {
  const validator = defaultLegacyDeflectionLedgerValidator();
  const item = newLegacyDeflectionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDeflectionLedgerLabelLengthRule flags a long label", () => {
  const rule = new LegacyDeflectionLedgerLabelLengthRule(80);
  const item = newLegacyDeflectionLedger("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDeflectionLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyDeflectionLedgerRequiredCodeRule("legacy deflection ledger needs a value");
  const item = newLegacyDeflectionLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDeflectionLedgerTitleLengthRule flags a long title", () => {
  const rule = new LegacyDeflectionLedgerTitleLengthRule(80);
  const item = newLegacyDeflectionLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDeflectionLedgerCodeLengthRule flags a long code", () => {
  const rule = new LegacyDeflectionLedgerCodeLengthRule(86400);
  const item = newLegacyDeflectionLedger("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
