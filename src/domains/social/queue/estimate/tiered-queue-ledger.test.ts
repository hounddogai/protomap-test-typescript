import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredQueueLedger } from "./tiered-queue-ledger.js";

test("TieredQueueLedger starts in idle", () => {
  const item = newTieredQueueLedger("code-898", "title-881");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredQueueLedger moves to ready", () => {
  const item = newTieredQueueLedger("code-898", "title-881");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredQueueLedger rejects moves from stopped", () => {
  const item = newTieredQueueLedger("code-898", "title-881");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
