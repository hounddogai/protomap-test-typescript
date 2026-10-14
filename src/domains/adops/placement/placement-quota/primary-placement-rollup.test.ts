import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPlacementRollup } from "./primary-placement-rollup.js";

test("PrimaryPlacementRollup starts in proposed", () => {
  const item = newPrimaryPlacementRollup("code-286", "name-139");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPlacementRollup moves to rejected", () => {
  const item = newPrimaryPlacementRollup("code-286", "name-139");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryPlacementRollup rejects moves from withdrawn", () => {
  const item = newPrimaryPlacementRollup("code-286", "name-139");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
