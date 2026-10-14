import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPlacementEstimate } from "./weighted-placement-estimate.js";

test("WeightedPlacementEstimate starts in idle", () => {
  const item = newWeightedPlacementEstimate("code-633", "title-685");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPlacementEstimate moves to draining", () => {
  const item = newWeightedPlacementEstimate("code-633", "title-685");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("WeightedPlacementEstimate rejects moves from stopped", () => {
  const item = newWeightedPlacementEstimate("code-633", "title-685");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
