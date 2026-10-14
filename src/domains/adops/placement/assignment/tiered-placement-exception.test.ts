import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPlacementException } from "./tiered-placement-exception.js";

test("TieredPlacementException starts in planned", () => {
  const item = newTieredPlacementException("code-465", "label-720");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPlacementException moves to completed", () => {
  const item = newTieredPlacementException("code-465", "label-720");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredPlacementException rejects moves from cancelled", () => {
  const item = newTieredPlacementException("code-465", "label-720");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
