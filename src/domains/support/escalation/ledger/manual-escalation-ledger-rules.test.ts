import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualEscalationLedgerClicksRangeRule,
  ManualEscalationLedgerLabelLengthRule,
  ManualEscalationLedgerRequiredCategoryRule,
  ManualEscalationLedgerWindowDaysRangeRule,
  defaultManualEscalationLedgerValidator,
} from "./manual-escalation-ledger-rules.js";
import { newManualEscalationLedger } from "./manual-escalation-ledger.js";

test("ManualEscalationLedgerValidator reports every problem", () => {
  const validator = defaultManualEscalationLedgerValidator();
  const item = newManualEscalationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualEscalationLedgerWindowDaysRangeRule flags values above window days", () => {
  const rule = new ManualEscalationLedgerWindowDaysRangeRule(16, 86400);
  const item = newManualEscalationLedger("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualEscalationLedgerRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualEscalationLedgerRequiredCategoryRule("manual escalation ledger needs a value");
  const item = newManualEscalationLedger("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualEscalationLedgerLabelLengthRule flags a long label", () => {
  const rule = new ManualEscalationLedgerLabelLengthRule(64);
  const item = newManualEscalationLedger("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualEscalationLedgerClicksRangeRule flags values above clicks", () => {
  const rule = new ManualEscalationLedgerClicksRangeRule(80, 3600);
  const item = newManualEscalationLedger("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
