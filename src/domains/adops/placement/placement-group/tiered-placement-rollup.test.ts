import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementRollup } from "./tiered-placement-rollup.js";

test("TieredPlacementRollup starts in idle", () => {
  const item = newTieredPlacementRollup("code-376", "name-689");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementRollup moves to ready", () => {
  const item = newTieredPlacementRollup("code-376", "name-689");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredPlacementRollup rejects moves from stopped", () => {
  const item = newTieredPlacementRollup("code-376", "name-689");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
