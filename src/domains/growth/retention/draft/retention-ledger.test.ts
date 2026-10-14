import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionLedger } from "./retention-ledger.js";

test("RetentionLedger starts in idle", () => {
  const item = newRetentionLedger("code-480", "name-573");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionLedger moves to stopped", () => {
  const item = newRetentionLedger("code-480", "name-573");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RetentionLedger rejects moves from stopped", () => {
  const item = newRetentionLedger("code-480", "name-573");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
