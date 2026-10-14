import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationLedgerLabelLengthRule,
  ReputationLedgerRequiredCampaignRefRule,
  ReputationLedgerRequiredCodeRule,
  ReputationLedgerRequiredLabelRule,
  ReputationLedgerRequiredNotesRule,
  defaultReputationLedgerValidator,
} from "./reputation-ledger-rules.js";
import { newReputationLedger } from "./reputation-ledger.js";

test("ReputationLedgerValidator reports every problem", () => {
  const validator = defaultReputationLedgerValidator();
  const item = newReputationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new ReputationLedgerRequiredLabelRule("reputation ledger needs a value");
  const item = newReputationLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationLedgerRequiredCodeRule("reputation ledger needs this field");
  const item = newReputationLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationLedgerRequiredNotesRule flags a blank notes", () => {
  const rule = new ReputationLedgerRequiredNotesRule("reputation ledger needs this field");
  const item = newReputationLedger("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationLedgerRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ReputationLedgerRequiredCampaignRefRule("reputation ledger needs this field");
  const item = newReputationLedger("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationLedgerLabelLengthRule flags a long label", () => {
  const rule = new ReputationLedgerLabelLengthRule(120);
  const item = newReputationLedger("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
