import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueLedger } from "./queue-ledger.js";

test("QueueLedger starts in open", () => {
  const item = newQueueLedger("code-236", "title-843");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueLedger moves to resolved", () => {
  const item = newQueueLedger("code-236", "title-843");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("QueueLedger rejects moves from archived", () => {
  const item = newQueueLedger("code-236", "title-843");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
