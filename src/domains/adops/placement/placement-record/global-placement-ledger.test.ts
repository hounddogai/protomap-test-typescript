import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPlacementLedger } from "./global-placement-ledger.js";

test("GlobalPlacementLedger starts in idle", () => {
  const item = newGlobalPlacementLedger("code-245", "title-435");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPlacementLedger moves to ready", () => {
  const item = newGlobalPlacementLedger("code-245", "title-435");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("GlobalPlacementLedger rejects moves from stopped", () => {
  const item = newGlobalPlacementLedger("code-245", "title-435");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
