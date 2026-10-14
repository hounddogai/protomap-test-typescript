import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementGroup } from "./batched-placement-group.js";

test("BatchedPlacementGroup starts in proposed", () => {
  const item = newBatchedPlacementGroup("code-305", "title-768");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementGroup moves to withdrawn", () => {
  const item = newBatchedPlacementGroup("code-305", "title-768");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("BatchedPlacementGroup rejects moves from withdrawn", () => {
  const item = newBatchedPlacementGroup("code-305", "title-768");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
