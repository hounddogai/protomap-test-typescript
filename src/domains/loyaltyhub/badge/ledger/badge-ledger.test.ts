import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeLedger } from "./badge-ledger.js";

test("BadgeLedger starts in idle", () => {
  const item = newBadgeLedger("code-811", "name-124");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeLedger moves to ready", () => {
  const item = newBadgeLedger("code-811", "name-124");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BadgeLedger rejects moves from stopped", () => {
  const item = newBadgeLedger("code-811", "name-124");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
