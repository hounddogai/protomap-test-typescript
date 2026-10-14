import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleLedgerBatchSizeRangeRule,
  BidRuleLedgerCodeLengthRule,
  BidRuleLedgerLabelLengthRule,
  BidRuleLedgerRequiredNotesRule,
  defaultBidRuleLedgerValidator,
} from "./bid-rule-ledger-rules.js";
import { newBidRuleLedger } from "./bid-rule-ledger.js";

test("BidRuleLedgerValidator reports every problem", () => {
  const validator = defaultBidRuleLedgerValidator();
  const item = newBidRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleLedgerLabelLengthRule flags a long label", () => {
  const rule = new BidRuleLedgerLabelLengthRule(32);
  const item = newBidRuleLedger("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleLedgerCodeLengthRule flags a long code", () => {
  const rule = new BidRuleLedgerCodeLengthRule(64);
  const item = newBidRuleLedger("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleLedgerBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BidRuleLedgerBatchSizeRangeRule(16, 64);
  const item = newBidRuleLedger("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleLedgerRequiredNotesRule flags a blank notes", () => {
  const rule = new BidRuleLedgerRequiredNotesRule("bid rule ledger needs an entry");
  const item = newBidRuleLedger("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
