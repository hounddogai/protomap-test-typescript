import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementRollup } from "./batched-placement-rollup.js";

test("BatchedPlacementRollup starts in requested", () => {
  const item = newBatchedPlacementRollup("code-269", "name-283");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementRollup moves to revoked", () => {
  const item = newBatchedPlacementRollup("code-269", "name-283");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BatchedPlacementRollup rejects moves from expired", () => {
  const item = newBatchedPlacementRollup("code-269", "name-283");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
