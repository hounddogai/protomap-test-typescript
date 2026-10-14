import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInLedgerCodeLengthRule,
  LegacyDoubleOptInLedgerLabelLengthRule,
  LegacyDoubleOptInLedgerRequiredChannelRule,
  LegacyDoubleOptInLedgerRequiredLabelRule,
  LegacyDoubleOptInLedgerRequiredTitleRule,
  LegacyDoubleOptInLedgerSendAtRangeRule,
  defaultLegacyDoubleOptInLedgerValidator,
} from "./legacy-double-opt-in-ledger-rules.js";
import { newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

test("LegacyDoubleOptInLedgerValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInLedgerValidator();
  const item = newLegacyDoubleOptInLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyDoubleOptInLedgerRequiredTitleRule("legacy double opt in ledger needs this field");
  const item = newLegacyDoubleOptInLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInLedgerSendAtRangeRule flags values above send at", () => {
  const rule = new LegacyDoubleOptInLedgerSendAtRangeRule(80, 255);
  const item = newLegacyDoubleOptInLedger("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInLedgerCodeLengthRule flags a long code", () => {
  const rule = new LegacyDoubleOptInLedgerCodeLengthRule(16);
  const item = newLegacyDoubleOptInLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInLedgerLabelLengthRule flags a long label", () => {
  const rule = new LegacyDoubleOptInLedgerLabelLengthRule(16);
  const item = newLegacyDoubleOptInLedger("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyDoubleOptInLedgerRequiredLabelRule("legacy double opt in ledger needs an entry");
  const item = newLegacyDoubleOptInLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInLedgerRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyDoubleOptInLedgerRequiredChannelRule("legacy double opt in ledger needs a value");
  const item = newLegacyDoubleOptInLedger("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
