import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementLedger } from "./tiered-placement-ledger.js";

test("TieredPlacementLedger starts in idle", () => {
  const item = newTieredPlacementLedger("code-510", "label-281");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementLedger moves to stopped", () => {
  const item = newTieredPlacementLedger("code-510", "label-281");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("TieredPlacementLedger rejects moves from stopped", () => {
  const item = newTieredPlacementLedger("code-510", "label-281");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
