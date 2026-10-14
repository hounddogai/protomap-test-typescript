import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementRollup } from "./placement-rollup.js";

test("PlacementRollup starts in requested", () => {
  const item = newPlacementRollup("code-563", "name-727");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementRollup moves to expired", () => {
  const item = newPlacementRollup("code-563", "name-727");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PlacementRollup rejects moves from expired", () => {
  const item = newPlacementRollup("code-563", "name-727");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
