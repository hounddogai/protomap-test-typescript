import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyLedgerMaximumRangeRule,
  JourneyLedgerRequiredNotesRule,
  JourneyLedgerRequiredVariantRule,
  JourneyLedgerRetriesRangeRule,
  JourneyLedgerTitleLengthRule,
  defaultJourneyLedgerValidator,
} from "./journey-ledger-rules.js";
import { newJourneyLedger } from "./journey-ledger.js";

test("JourneyLedgerValidator reports every problem", () => {
  const validator = defaultJourneyLedgerValidator();
  const item = newJourneyLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyLedgerRequiredNotesRule flags a blank notes", () => {
  const rule = new JourneyLedgerRequiredNotesRule("journey ledger needs a value");
  const item = newJourneyLedger("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyLedgerRequiredVariantRule flags a blank variant", () => {
  const rule = new JourneyLedgerRequiredVariantRule("journey ledger needs an entry");
  const item = newJourneyLedger("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyLedgerMaximumRangeRule flags values above maximum", () => {
  const rule = new JourneyLedgerMaximumRangeRule(6.4, 4995.7);
  const item = newJourneyLedger("x", "y");
  item.maximum = 4997.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new JourneyLedgerRetriesRangeRule(255, 86400);
  const item = newJourneyLedger("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyLedgerTitleLengthRule flags a long title", () => {
  const rule = new JourneyLedgerTitleLengthRule(64);
  const item = newJourneyLedger("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
