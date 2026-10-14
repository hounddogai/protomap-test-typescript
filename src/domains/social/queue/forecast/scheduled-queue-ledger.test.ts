import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledQueueLedger } from "./scheduled-queue-ledger.js";

test("ScheduledQueueLedger starts in open", () => {
  const item = newScheduledQueueLedger("code-111", "name-427");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledQueueLedger moves to resolved", () => {
  const item = newScheduledQueueLedger("code-111", "name-427");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledQueueLedger rejects moves from archived", () => {
  const item = newScheduledQueueLedger("code-111", "name-427");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
