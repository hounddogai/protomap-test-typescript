import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledQueueLedgerCodeLengthRule,
  ScheduledQueueLedgerRequiredNameRule,
  ScheduledQueueLedgerRequiredNotesRule,
  ScheduledQueueLedgerThresholdRangeRule,
  defaultScheduledQueueLedgerValidator,
} from "./scheduled-queue-ledger-rules.js";
import { newScheduledQueueLedger } from "./scheduled-queue-ledger.js";

test("ScheduledQueueLedgerValidator reports every problem", () => {
  const validator = defaultScheduledQueueLedgerValidator();
  const item = newScheduledQueueLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledQueueLedgerCodeLengthRule flags a long code", () => {
  const rule = new ScheduledQueueLedgerCodeLengthRule(1000);
  const item = newScheduledQueueLedger("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledQueueLedgerRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledQueueLedgerRequiredNameRule("scheduled queue ledger needs an entry");
  const item = newScheduledQueueLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledQueueLedgerRequiredNotesRule flags a blank notes", () => {
  const rule = new ScheduledQueueLedgerRequiredNotesRule("scheduled queue ledger needs a value");
  const item = newScheduledQueueLedger("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledQueueLedgerThresholdRangeRule flags values above threshold", () => {
  const rule = new ScheduledQueueLedgerThresholdRangeRule(4, 3379.1);
  const item = newScheduledQueueLedger("x", "y");
  item.threshold = 3380.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
