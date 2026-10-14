import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFlightLedger } from "./fallback-flight-ledger.js";

test("FallbackFlightLedger starts in idle", () => {
  const item = newFallbackFlightLedger("code-217", "title-668");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFlightLedger moves to stopped", () => {
  const item = newFallbackFlightLedger("code-217", "title-668");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FallbackFlightLedger rejects moves from stopped", () => {
  const item = newFallbackFlightLedger("code-217", "title-668");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
