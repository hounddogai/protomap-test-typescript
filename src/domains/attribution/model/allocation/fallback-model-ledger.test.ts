import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackModelLedger } from "./fallback-model-ledger.js";

test("FallbackModelLedger starts in idle", () => {
  const item = newFallbackModelLedger("code-661", "name-896");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackModelLedger moves to warming", () => {
  const item = newFallbackModelLedger("code-661", "name-896");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackModelLedger rejects moves from stopped", () => {
  const item = newFallbackModelLedger("code-661", "name-896");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
