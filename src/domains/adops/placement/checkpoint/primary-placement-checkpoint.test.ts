import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

test("PrimaryPlacementCheckpoint starts in idle", () => {
  const item = newPrimaryPlacementCheckpoint("code-443", "title-96");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPlacementCheckpoint moves to warming", () => {
  const item = newPrimaryPlacementCheckpoint("code-443", "title-96");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PrimaryPlacementCheckpoint rejects moves from stopped", () => {
  const item = newPrimaryPlacementCheckpoint("code-443", "title-96");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
