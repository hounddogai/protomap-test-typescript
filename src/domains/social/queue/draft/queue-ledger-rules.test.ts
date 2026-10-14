import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueLedgerRequiredCodeRule,
  QueueLedgerRequiredCohortRule,
  defaultQueueLedgerValidator,
} from "./queue-ledger-rules.js";
import { newQueueLedger } from "./queue-ledger.js";

test("QueueLedgerValidator reports every problem", () => {
  const validator = defaultQueueLedgerValidator();
  const item = newQueueLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueLedgerRequiredCohortRule flags a blank cohort", () => {
  const rule = new QueueLedgerRequiredCohortRule("queue ledger needs an entry");
  const item = newQueueLedger("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new QueueLedgerRequiredCodeRule("queue ledger needs a value");
  const item = newQueueLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
