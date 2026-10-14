import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementSlot } from "./tiered-placement-slot.js";

test("TieredPlacementSlot starts in new", () => {
  const item = newTieredPlacementSlot("code-23", "name-543");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementSlot moves to running", () => {
  const item = newTieredPlacementSlot("code-23", "name-543");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredPlacementSlot rejects moves from failed", () => {
  const item = newTieredPlacementSlot("code-23", "name-543");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
