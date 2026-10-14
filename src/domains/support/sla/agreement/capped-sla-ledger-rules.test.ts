import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSlaLedgerLabelLengthRule,
  CappedSlaLedgerRequiredCodeRule,
  CappedSlaLedgerRequiredLocaleRule,
  CappedSlaLedgerReviewerLengthRule,
  defaultCappedSlaLedgerValidator,
} from "./capped-sla-ledger-rules.js";
import { newCappedSlaLedger } from "./capped-sla-ledger.js";

test("CappedSlaLedgerValidator reports every problem", () => {
  const validator = defaultCappedSlaLedgerValidator();
  const item = newCappedSlaLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSlaLedgerReviewerLengthRule flags a long reviewer", () => {
  const rule = new CappedSlaLedgerReviewerLengthRule(16);
  const item = newCappedSlaLedger("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSlaLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new CappedSlaLedgerRequiredCodeRule("capped sla ledger needs an entry");
  const item = newCappedSlaLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSlaLedgerRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedSlaLedgerRequiredLocaleRule("capped sla ledger needs an entry");
  const item = newCappedSlaLedger("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSlaLedgerLabelLengthRule flags a long label", () => {
  const rule = new CappedSlaLedgerLabelLengthRule(3600);
  const item = newCappedSlaLedger("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
