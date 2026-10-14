import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFrequencyLedgerBidRangeRule,
  GlobalFrequencyLedgerCreatedAtRangeRule,
  GlobalFrequencyLedgerRequiredTitleRule,
  defaultGlobalFrequencyLedgerValidator,
} from "./global-frequency-ledger-rules.js";
import { newGlobalFrequencyLedger } from "./global-frequency-ledger.js";

test("GlobalFrequencyLedgerValidator reports every problem", () => {
  const validator = defaultGlobalFrequencyLedgerValidator();
  const item = newGlobalFrequencyLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFrequencyLedgerCreatedAtRangeRule flags values above created at", () => {
  const rule = new GlobalFrequencyLedgerCreatedAtRangeRule(64, 1000);
  const item = newGlobalFrequencyLedger("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFrequencyLedgerBidRangeRule flags values above bid", () => {
  const rule = new GlobalFrequencyLedgerBidRangeRule(8.7, 267.4);
  const item = newGlobalFrequencyLedger("x", "y");
  item.bid = 268.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFrequencyLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalFrequencyLedgerRequiredTitleRule("global frequency ledger needs a value");
  const item = newGlobalFrequencyLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
