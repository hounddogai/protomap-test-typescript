import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("RollingPlacementLedger starts in idle", () => {
  const item = newRollingPlacementLedger("code-443", "name-485");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPlacementLedger moves to draining", () => {
  const item = newRollingPlacementLedger("code-443", "name-485");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RollingPlacementLedger rejects moves from stopped", () => {
  const item = newRollingPlacementLedger("code-443", "name-485");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
