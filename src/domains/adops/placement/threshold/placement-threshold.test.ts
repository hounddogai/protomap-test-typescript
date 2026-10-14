import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementThreshold } from "./placement-threshold.js";

test("PlacementThreshold starts in created", () => {
  const item = newPlacementThreshold("code-917", "name-562");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementThreshold moves to validated", () => {
  const item = newPlacementThreshold("code-917", "name-562");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PlacementThreshold rejects moves from retired", () => {
  const item = newPlacementThreshold("code-917", "name-562");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
