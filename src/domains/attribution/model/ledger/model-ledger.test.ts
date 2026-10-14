import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelLedger } from "./model-ledger.js";

test("ModelLedger starts in idle", () => {
  const item = newModelLedger("code-366", "label-239");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelLedger moves to ready", () => {
  const item = newModelLedger("code-366", "label-239");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ModelLedger rejects moves from stopped", () => {
  const item = newModelLedger("code-366", "label-239");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
