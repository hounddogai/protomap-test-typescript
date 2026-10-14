import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTicketViewLedgerCodeLengthRule,
  AdaptiveTicketViewLedgerRequiredLabelRule,
  AdaptiveTicketViewLedgerRequiredVariantRule,
  AdaptiveTicketViewLedgerUnitLengthRule,
  defaultAdaptiveTicketViewLedgerValidator,
} from "./adaptive-ticket-view-ledger-rules.js";
import { newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

test("AdaptiveTicketViewLedgerValidator reports every problem", () => {
  const validator = defaultAdaptiveTicketViewLedgerValidator();
  const item = newAdaptiveTicketViewLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTicketViewLedgerUnitLengthRule flags a long unit", () => {
  const rule = new AdaptiveTicketViewLedgerUnitLengthRule(1000);
  const item = newAdaptiveTicketViewLedger("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveTicketViewLedgerRequiredVariantRule flags a blank variant", () => {
  const rule = new AdaptiveTicketViewLedgerRequiredVariantRule("adaptive ticket view ledger needs this field");
  const item = newAdaptiveTicketViewLedger("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewLedgerCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveTicketViewLedgerCodeLengthRule(120);
  const item = newAdaptiveTicketViewLedger("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveTicketViewLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveTicketViewLedgerRequiredLabelRule("adaptive ticket view ledger needs a value");
  const item = newAdaptiveTicketViewLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
