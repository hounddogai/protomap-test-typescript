import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementTier } from "./placement-tier.js";

test("PlacementTier starts in new", () => {
  const item = newPlacementTier("code-266", "name-922");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementTier moves to running", () => {
  const item = newPlacementTier("code-266", "name-922");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PlacementTier rejects moves from failed", () => {
  const item = newPlacementTier("code-266", "name-922");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
