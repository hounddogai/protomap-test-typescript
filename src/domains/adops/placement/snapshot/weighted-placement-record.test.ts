import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPlacementRecord } from "./weighted-placement-record.js";

test("WeightedPlacementRecord starts in planned", () => {
  const item = newWeightedPlacementRecord("code-175", "label-437");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPlacementRecord moves to cancelled", () => {
  const item = newWeightedPlacementRecord("code-175", "label-437");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WeightedPlacementRecord rejects moves from cancelled", () => {
  const item = newWeightedPlacementRecord("code-175", "label-437");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
