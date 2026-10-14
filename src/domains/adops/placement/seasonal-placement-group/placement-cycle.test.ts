import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementCycle } from "./placement-cycle.js";

test("PlacementCycle starts in idle", () => {
  const item = newPlacementCycle("code-499", "name-741");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementCycle moves to ready", () => {
  const item = newPlacementCycle("code-499", "name-741");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PlacementCycle rejects moves from stopped", () => {
  const item = newPlacementCycle("code-499", "name-741");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
