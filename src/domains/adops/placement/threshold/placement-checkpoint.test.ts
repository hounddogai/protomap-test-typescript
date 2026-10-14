import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementCheckpoint } from "./placement-checkpoint.js";

test("PlacementCheckpoint starts in created", () => {
  const item = newPlacementCheckpoint("code-257", "label-422");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementCheckpoint moves to retired", () => {
  const item = newPlacementCheckpoint("code-257", "label-422");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PlacementCheckpoint rejects moves from retired", () => {
  const item = newPlacementCheckpoint("code-257", "label-422");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
