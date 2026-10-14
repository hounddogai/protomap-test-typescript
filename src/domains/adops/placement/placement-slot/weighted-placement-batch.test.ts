import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPlacementBatch } from "./weighted-placement-batch.js";

test("WeightedPlacementBatch starts in new", () => {
  const item = newWeightedPlacementBatch("code-832", "title-160");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPlacementBatch moves to running", () => {
  const item = newWeightedPlacementBatch("code-832", "title-160");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedPlacementBatch rejects moves from failed", () => {
  const item = newWeightedPlacementBatch("code-832", "title-160");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
