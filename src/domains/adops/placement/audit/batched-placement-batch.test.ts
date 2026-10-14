import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementBatch } from "./batched-placement-batch.js";

test("BatchedPlacementBatch starts in idle", () => {
  const item = newBatchedPlacementBatch("code-491", "title-36");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementBatch moves to draining", () => {
  const item = newBatchedPlacementBatch("code-491", "title-36");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedPlacementBatch rejects moves from stopped", () => {
  const item = newBatchedPlacementBatch("code-491", "title-36");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
