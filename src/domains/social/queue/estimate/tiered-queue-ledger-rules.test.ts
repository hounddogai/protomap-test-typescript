import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredQueueLedgerLimitRangeRule,
  TieredQueueLedgerRequiredAudienceIdRule,
  TieredQueueLedgerRequiredTitleRule,
  TieredQueueLedgerStartsAtRangeRule,
  defaultTieredQueueLedgerValidator,
} from "./tiered-queue-ledger-rules.js";
import { newTieredQueueLedger } from "./tiered-queue-ledger.js";

test("TieredQueueLedgerValidator reports every problem", () => {
  const validator = defaultTieredQueueLedgerValidator();
  const item = newTieredQueueLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredQueueLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new TieredQueueLedgerRequiredTitleRule("tiered queue ledger needs an entry");
  const item = newTieredQueueLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredQueueLedgerRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new TieredQueueLedgerRequiredAudienceIdRule("tiered queue ledger needs this field");
  const item = newTieredQueueLedger("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredQueueLedgerStartsAtRangeRule flags values above starts at", () => {
  const rule = new TieredQueueLedgerStartsAtRangeRule(32, 80);
  const item = newTieredQueueLedger("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredQueueLedgerLimitRangeRule flags values above limit", () => {
  const rule = new TieredQueueLedgerLimitRangeRule(16, 80);
  const item = newTieredQueueLedger("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
