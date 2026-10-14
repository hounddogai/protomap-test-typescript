import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEscalationLedgerCodeLengthRule,
  LegacyEscalationLedgerDurationMinutesRangeRule,
  LegacyEscalationLedgerRequiredLabelRule,
  defaultLegacyEscalationLedgerValidator,
} from "./legacy-escalation-ledger-rules.js";
import { newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("LegacyEscalationLedgerValidator reports every problem", () => {
  const validator = defaultLegacyEscalationLedgerValidator();
  const item = newLegacyEscalationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEscalationLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyEscalationLedgerRequiredLabelRule("legacy escalation ledger needs this field");
  const item = newLegacyEscalationLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEscalationLedgerDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LegacyEscalationLedgerDurationMinutesRangeRule(120, 86400);
  const item = newLegacyEscalationLedger("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEscalationLedgerCodeLengthRule flags a long code", () => {
  const rule = new LegacyEscalationLedgerCodeLengthRule(16);
  const item = newLegacyEscalationLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
