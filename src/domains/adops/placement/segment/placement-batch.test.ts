import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementBatch } from "./placement-batch.js";

test("PlacementBatch starts in proposed", () => {
  const item = newPlacementBatch("code-171", "label-608");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementBatch moves to approved", () => {
  const item = newPlacementBatch("code-171", "label-608");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PlacementBatch rejects moves from withdrawn", () => {
  const item = newPlacementBatch("code-171", "label-608");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
